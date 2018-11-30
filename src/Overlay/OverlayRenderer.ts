import { ChildProcess } from 'child_process';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';
import { IFilePath, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import IFileSystem from '../FileSystem/IFileSystem';
import { showOverlay, refreshOverlay } from '../API/OverlayAPI';

class OverlayRenderer {

	private overlayProcesses: {
		[id: string]: {
			process: ChildProcess;
			width: number;
			height: number;
			x?: number;
			y?: number;
			horizontalTranslation?: number;
			verticalTranslation?: number;
			maxHorizontalOffset?: number;
			maxVerticalOffset?: number;
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
		horizontalTranslation?: number,
		verticalTranslation?: number,
		maxHorizontalOffset?: number,
		maxVerticalOffset?: number,
	) {
		const filePath = await this.saveToFile(id, appletUid, fileBuffer);
		const processId = this.getOverlayId(id, appletUid);
		const args = [ x, y, horizontalTranslation, verticalTranslation, maxHorizontalOffset, maxVerticalOffset ];

		if (this.overlayProcesses[processId]) {
			const runningProcess = this.overlayProcesses[processId];
			if (runningProcess.width === width &&
				runningProcess.height === height &&
				runningProcess.x === x &&
				runningProcess.y === y &&
				runningProcess.horizontalTranslation === horizontalTranslation &&
				runningProcess.verticalTranslation === verticalTranslation &&
				runningProcess.maxHorizontalOffset === maxHorizontalOffset &&
				runningProcess.maxVerticalOffset === maxVerticalOffset
			) {
				await this.refreshProcess(processId);
			} else {
				await this.stopProcess(processId);
				this.startProcess(processId, filePath, width, height, ...args);
			}
		} else {
			this.startProcess(processId, filePath, width, height, ...args);
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
		horizontalTranslation?: number,
		verticalTranslation?: number,
		maxHorizontalOffset?: number,
		maxVerticalOffset?: number,
	) {
		const fileAbsolutePath = this.fileSystem.getAbsolutePath(overlayFilePath);
		const childProcess = showOverlay(
			fileAbsolutePath,
			x,
			y,
			horizontalTranslation,
			verticalTranslation,
			maxHorizontalOffset,
			maxVerticalOffset,
		);
		this.overlayProcesses[processId] = {
			process: childProcess, width, height, x, y, horizontalTranslation, verticalTranslation, maxHorizontalOffset, maxVerticalOffset,
		};
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
}

export default OverlayRenderer;
