import { EventEmitter } from 'events';
import { promisify } from 'util';
import { ChildProcess, spawn, exec } from "child_process";
import * as AsyncLock from 'async-lock';
import { checksumString } from '@signageos/front-display/es6/Hash/checksum';
import IVideoPlayer from '@signageos/front-display/es6/Video/IVideoPlayer';
import IVideo from '@signageos/front-display/es6/Video/IVideo';
import wait from '@signageos/lib/dist/Timer/wait';
import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import IFileSystem from '../../FileSystem/IFileSystem';
import { getLastFramePathFromVideoPath } from './helper';

export default class OmxplayerVideoPlayer implements IVideoPlayer {

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

	public constructor(private distDirectory: string, private lock: AsyncLock, private fileSystem: IFileSystem) {}

	public async prepare(uri: string, _x: number, _y: number, _width: number, _height: number): Promise<void> {
		if (!(await this.fileSystem.pathExists(uri)) ||
			!(await this.fileSystem.isFile(uri))
		) {
			throw new Error('Video not found');
		}

		const command = this.distDirectory + '/ffmpeg-extract-video-last-frame.sh';
		const videoFullPath = this.fileSystem.getFullPath(uri);
		const lastFrameFullPath = getLastFramePathFromVideoPath(videoFullPath);

		if (!(await this.fileSystem.pathExists(lastFrameFullPath))) {
			await promisify(exec)(command + ' ' + videoFullPath + ' ' + lastFrameFullPath);
		}
	}

	public async play(uri: string, x: number, y: number, width: number, height: number): Promise<IVideo> {
		return await this.lock.acquire('video', async () => {
			const videoId = OmxplayerVideoPlayer.getVideoIdentificator(uri, x, y, width, height);
			if (this.videoProcesses[videoId]) {
				throw new Error('Video is already playing');
			}

			if (!(await this.fileSystem.pathExists(uri)) ||
				!(await this.fileSystem.isFile(uri))
			) {
				throw new Error('Video not found');
			}

			return await this.runVideoChildProcess(videoId, uri, x, y, width, height);
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

	private async runVideoChildProcess(videoId: string, uri: string, x: number, y: number, width: number, height: number) {
		const videoFullPath = this.fileSystem.getFullPath(uri);
		const videoProcess = spawn(
			'omxplayer',
			[
				'--threshold',
				'1',
				'--aspect-mode',
				'letterbox',
				'--win',
				`${x},${y},${width},${height}`,
				videoFullPath,
			] as ReadonlyArray<string>,
		);
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
}
