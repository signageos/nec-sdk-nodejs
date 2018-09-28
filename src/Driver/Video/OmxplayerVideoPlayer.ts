import { EventEmitter } from 'events';
import * as path from 'path';
import { promisify } from 'util';
import { ChildProcess, exec, spawn } from "child_process";
import * as AsyncLock from 'async-lock';
import { checksumString } from '@signageos/front-display/es6/Hash/checksum';
import IVideo from '@signageos/front-display/es6/Video/IVideo';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import wait from '@signageos/lib/dist/Timer/wait';
import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import IFileSystem from '../../FileSystem/IFileSystem';
import { getLastFramePathFromVideoPath } from './helper';
import IServerVideoPlayer from './IServerVideoPlayer';

export default class OmxplayerVideoPlayer implements IServerVideoPlayer {

	private videoProcesses: {
		[videoId: string]: {
			process: ChildProcess;
			running: boolean;
			uri: string;
			x: number;
			y: number;
			width: number;
			height: number;
		}
	} = {};

	private static getVideoIdentificator(uri: string, x: number, y: number, width: number, height: number) {
		return checksumString(uri) + '_' + x + 'x' + y + '-' + width + 'x' + height;
	}

	public constructor(private scriptsDirectory: string, private lock: AsyncLock, private fileSystem: IFileSystem) {}

	public async prepare(uri: string, _x: number, _y: number, _width: number, _height: number): Promise<void> {
		if (!(await this.fileSystem.pathExists(uri)) ||
			!(await this.fileSystem.isFile(uri))
		) {
			throw new Error('Video not found');
		}

		const lastFrameRelativePath = getLastFramePathFromVideoPath(uri);
		if (await this.fileSystem.pathExists(lastFrameRelativePath)) {
			return;
		}

		const command = path.join(this.scriptsDirectory, 'ffmpeg-extract-video-last-frame.sh');
		const videoFullPath = this.fileSystem.getFullPath(uri);
		const lastFrameFullPath = getLastFramePathFromVideoPath(videoFullPath);

		await promisify(exec)(command + ' ' + videoFullPath + ' ' + lastFrameFullPath);
	}

	public async play(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		orientation: Orientation,
		isStream: boolean,
	): Promise<IVideo> {
		return await this.lock.acquire('video', async () => {
			const videoId = OmxplayerVideoPlayer.getVideoIdentificator(uri, x, y, width, height);
			if (this.videoProcesses[videoId]) {
				throw new Error('Video is already playing');
			}

			if (!isStream && (!(await this.fileSystem.pathExists(uri)) || !(await this.fileSystem.isFile(uri)))) {
				throw new Error('Video not found');
			}

			return await this.runVideoChildProcess(videoId, uri, x, y, width, height, orientation, isStream);
		});

	}

	public async stop(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		await this.lock.acquire('video', async () => {
			const videoId = OmxplayerVideoPlayer.getVideoIdentificator(uri, x, y, width, height);
			if (!this.videoProcesses[videoId]) {
				throw new Error('Video is not playing');
			}

			await this.stopVideo(uri, x, y, width, height);
		});
	}

	public async pause(_uri: string, _x: number, _y: number, _width: number, _height: number): Promise<void> {
		throw new Error('Not implemented');
	}

	public async resume(_uri: string, _x: number, _y: number, _width: number, _height: number): Promise<void> {
		throw new Error('Not implemented');
	}

	public async clearAll(): Promise<void> {
		await this.lock.acquire('video', async () => {
			await Promise.all(
				Object.keys(this.videoProcesses).map(async (videoId: string) => {
					const { uri, x, y, width, height } = this.videoProcesses[videoId];
					try {
						await this.stopVideo(uri, x, y, width, height);
					} catch (error) {
						console.error('clearAll(): Failed to stop video', { uri, x, y, width, height });
					}
				}),
			);
		});
	}

	private async stopVideo(uri: string, x: number, y: number, width: number, height: number) {
		const videoId = OmxplayerVideoPlayer.getVideoIdentificator(uri, x, y, width, height);
		if (this.videoProcesses[videoId].running) {
			const videoProcess = this.videoProcesses[videoId].process;
			const killedPromise = Promise.race([
				new Promise<void>((resolve: () => void) => videoProcess.once('close', resolve)),
				new Promise<void>((resolve: () => void) => videoProcess.once('error', resolve)),
				(async () => {
					// after 2s send a SIGKILL signal to force the process to close
					await wait(2 * SECOND_IN_MS);
					videoProcess.kill('SIGKILL');
				})(),
			] as Promise<void>[]);

			videoProcess.kill('SIGINT');
			await killedPromise;
		}

		delete this.videoProcesses[videoId];
	}

	private async runVideoChildProcess(
		videoId: string,
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		orientation: Orientation,
		isStream: boolean,
	) {
		const videoFullPath = isStream ? uri : this.fileSystem.getFullPath(uri);
		const rotationAngle = this.convertOrientationToRotationAngle(orientation);

		const processArgs = [
			'--threshold',
			'1',
			'--aspect-mode',
			'letterbox',
			'--win',
			`${x},${y},${width},${height}`,
			'--orientation',
			rotationAngle,
		];

		if (isStream) {
			processArgs.push('--live');
		}

		const videoProcess = spawn('omxplayer', [ ...processArgs, videoFullPath ] as ReadonlyArray<string>);
		const videoEventEmitter = this.createVideoEventEmitter(uri, x, y, width, height, videoProcess);
		this.videoProcesses[videoId] = { process: videoProcess, running: true, uri, x, y, width, height };

		videoProcess.on('close', () => {
			if (this.videoProcesses[videoId]) {
				this.videoProcesses[videoId].running = false;
			}
		});

		videoProcess.on('error', (error: Error) => {
			console.error('video error', error, { uri, x, y, width, height });
		});

		// wait for the process to actually do something
		await Promise.race([
			new Promise<void>((resolve: () => void) => videoProcess.stdout.once('data', resolve)),
			new Promise<void>((resolve: () => void) => videoProcess.stderr.once('data', resolve)),
			new Promise<void>((resolve: () => void) => videoProcess.once('close', resolve)),
			wait(1500),
		] as Promise<void>[]);

		return videoEventEmitter;
	}

	private createVideoEventEmitter(uri: string, x: number, y: number, width: number, height: number, videoProcess: ChildProcess) {
		const eventEmitter = new EventEmitter();
		const videoEventSrcArgs = { uri, x, y, width, height };

		videoProcess.once('close', (code: number, signal: string | null) => {
			if (signal !== null) {
				eventEmitter.emit('stopped', { type: 'stopped', srcArguments: videoEventSrcArgs });
			} else if (code === 0) {
				eventEmitter.emit('ended', { type: 'ended', srcArguments: videoEventSrcArgs });
			} else {
				eventEmitter.emit('error', {
					type: 'error',
					srcArguments: videoEventSrcArgs,
					data: {
						message: 'Process finished with exit code ' + code,
					},
				});
			}
		});

		return eventEmitter;
	}

	private convertOrientationToRotationAngle(orientation: Orientation) {
		switch (orientation) {
			case Orientation.PORTRAIT:
				return 90;
			case Orientation.LANDSCAPE_FLIPPED:
				return 180;
			case Orientation.PORTRAIT_FLIPPED:
				return 270;
			default:
				return 0;
		}
	}
}
