import { ChildProcess } from 'child_process';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';
import { IFilePath, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { checksumString } from '@signageos/front-display/es6/Hash/checksum';
import IFileSystem from '../FileSystem/IFileSystem';
import { showOverlay, refreshOverlay } from '../API/OverlayAPI';

class OverlayRenderer {

	private overlayProcesses: {
		[id: string]: {
			process: ChildProcess;
			checksum: string;
		};
	} = {};

	constructor(private fileSystem: IFileSystem) {}

	@locked('overlay')
	public async render(
		fileBuffer: Buffer,
		id: string,
		appletUid: string,
		width: number,
		height: number,
		x?: number,
		y?: number,
		animate: boolean = false,
		animationDuration?: number,
		animationKeyframes?: {
			percentage: number;
			x: number;
			y: number;
		}[],
	) {
		const filePath = await this.saveToFile(id, appletUid, fileBuffer);
		const processId = this.getOverlayId(id, appletUid);

		if (this.overlayProcesses[processId]) {
			const runningProcess = this.overlayProcesses[processId];
			const checksum = this.getOverlayInstanceChecksum(width, height, x, y, animate, animationDuration, animationKeyframes);
			if (runningProcess.checksum === checksum) {
				await this.refreshProcess(processId);
			} else {
				await this.stopProcess(processId);
				this.startProcess(processId, filePath, width, height, x, y, animate, animationDuration, animationKeyframes);
			}
		} else {
			this.startProcess(processId, filePath, width, height, x, y, animate, animationDuration, animationKeyframes);
		}
	}

	@locked('overlay')
	public async hide(id: string, appletUid: string) {
		const processId = this.getOverlayId(id, appletUid);
		await this.stopProcess(processId);
		delete this.overlayProcesses[processId];
	}

	@locked('overlay')
	public async hideAll() {
		await Promise.all(
			Object.keys(this.overlayProcesses).map(
				(processId: string) => this.stopProcess(processId),
			),
		);
		this.overlayProcesses = {};
	}

	private async saveToFile(id: string, appletUid: string, fileBuffer: Buffer) {
		const storageUnit = this.fileSystem.getTmpStorageUnit();
		const directoryPath = await this.getOverlayDirectoryFilePath(appletUid, storageUnit);
		await this.fileSystem.ensureDirectory(directoryPath);
		const filePath = await this.getOverlayFilePath(id, appletUid, storageUnit);
		await this.fileSystem.saveToFile(filePath, fileBuffer);
		return filePath;
	}

	private startProcess(
		processId: string,
		overlayFilePath: IFilePath,
		width: number,
		height: number,
		x?: number,
		y?: number,
		animate: boolean = false,
		animationDuration?: number,
		animationKeyframes?: {
			percentage: number;
			x: number;
			y: number;
		}[],
	) {
		const fileAbsolutePath = this.fileSystem.getAbsolutePath(overlayFilePath);
		const childProcess = showOverlay(
			fileAbsolutePath,
			x,
			y,
			animate,
			animationDuration,
			animationKeyframes,
		);
		const checksum = this.getOverlayInstanceChecksum(width, height, x, y, animate, animationDuration, animationKeyframes);
		this.overlayProcesses[processId] = { process: childProcess, checksum };
		childProcess.once('close', (code: number) => {
			if (code !== 0) {
				console.warn('overlay process closed with error code: ' + code);
			}
			delete this.overlayProcesses[processId];
		});
	}

	private async refreshProcess(processId: string) {
		const overlayChildProcess = this.overlayProcesses[processId];
		if (!overlayChildProcess) {
			throw new Error('Trying to hide overlay that\'s not showing');
		}
		await refreshOverlay(overlayChildProcess.process);
	}

	private async stopProcess(processId: string) {
		const overlayChildProcess = this.overlayProcesses[processId];
		if (!overlayChildProcess) {
			throw new Error('Trying to hide overlay that\'s not showing');
		}

		overlayChildProcess.process.removeAllListeners('close');
		const timeout = setTimeout(
			() => {
				overlayChildProcess.process.kill('SIGKILL');
			},
			2e3,
		);
		overlayChildProcess.process.once('close', () => clearTimeout(timeout));
		overlayChildProcess.process.kill('SIGTERM');
	}

	private getOverlayId(id: string, appletUid: string) {
		return appletUid + '_' + id;
	}

	private async getOverlayDirectoryFilePath(appletUid: string, storageUnit: IStorageUnit): Promise<IFilePath> {
		return {
			filePath: this.getOverlayDirectory(appletUid),
			storageUnit,
		};
	}

	private async getOverlayFilePath(id: string, appletUid: string, storageUnit: IStorageUnit): Promise<IFilePath> {
		const directoryPath = this.getOverlayDirectory(appletUid);
		return {
			filePath: directoryPath + '/' + id + '.png',
			storageUnit: storageUnit,
		};
	}

	private getOverlayDirectory(appletUid: string) {
		return 'overlay/' + appletUid;
	}

	private getOverlayInstanceChecksum(
		width: number,
		height: number,
		x?: number,
		y?: number,
		animate: boolean = false,
		animationDuration?: number,
		animationKeyframes?: {
			percentage: number;
			x: number;
			y: number;
		}[],
	) {
		let fullString = '' + width + height + (x || 0) + (y || 0) + (animate ? 1 : 0) + (animationDuration || 0);
		if (animationKeyframes) {
			for (let animationKeyframe of animationKeyframes) {
				fullString += animationKeyframe.percentage + animationKeyframe.x + animationKeyframe.y;
			}
		}
		return checksumString(fullString);
	}
}

export default OverlayRenderer;
