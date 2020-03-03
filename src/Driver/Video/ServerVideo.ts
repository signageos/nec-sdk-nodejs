import { EventEmitter } from "events";
import { ChildProcess } from "child_process";
import wait from '@signageos/lib/dist/Timer/wait';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import VideoOrientation from '@signageos/front-display/es6/Video/Orientation';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import {
	IVideoAPI,
} from '../../API/VideoAPI';
import IUnixSocketEventListener from '../../UnixSocket/IUnixSocketEventListener';
import IFileSystem from '../../FileSystem/IFileSystem';
import IServerVideo from './IServerVideo';
import ISystemSettings from '../../SystemSettings/ISystemSettings';
import * as Debug from 'debug';
import { IOptions } from '@signageos/front-display/es6/Video/IVideoPlayer';
const debug = Debug('@signageos/display-linux:Driver:Video:ServerVideo');

export enum State {
	IDLE,
	PLAYING,
}

export interface IVideoArguments {
	uri: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export default class ServerVideo implements IServerVideo {

	private state: State = State.IDLE;
	private eventEmitter: EventEmitter;
	private videoArguments: IVideoArguments | null = null;
	private childProcess: ChildProcess | null = null;
	private isStream: boolean = false;
	private finished: boolean = false;

	constructor(
		private fileSystem: IFileSystem,
		private systemSettings: ISystemSettings,
		private key: string,
		private videoAPI: IVideoAPI,
		private videoEventListener: IUnixSocketEventListener,
	) {
		this.eventEmitter = new EventEmitter();
	}

	public async initialize() {
		await this.videoEventListener.listen();
	}

	public async close() {
		try {
			await this.stop();
		} catch (error) {
			console.warn(error);
		}
		await this.videoEventListener.close();
	}

	public getVideoArguments(): IVideoArguments | null {
		return this.videoArguments;
	}

	public async prepare(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		isStream: boolean,
		options: IOptions = {},
	) {
		if (this.childProcess) {
			await this.stop();
		}

		const readyPromise = new Promise<void>((resolve: () => void) => {
			this.videoEventListener.once('ready', resolve);
		});

		this.childProcess = await this.prepareVideoChildProcess(uri, x, y, width, height, isStream, options);
		this.videoArguments = { uri, x, y, width, height };
		this.isStream = isStream;

		const closedPromise = new Promise<void>((_resolve: () => void, reject: (error: Error) => void) => {
			this.childProcess!.once('close', () => {
				reject(new Error('Video process closed while preparing'));
			});
		});

		await Promise.race([readyPromise, closedPromise]);
	}

	public async play() {
		if (!this.childProcess) {
			throw new Error('Trying to play video that\'s not prepared, video key: ' + this.key);
		}

		const playingPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			this.videoEventListener.once('started', resolve);
			this.childProcess!.once('close', () => {
				reject(new Error('Video process closed before it could play'));
			});
		});

		if (this.isStream) {
			await this.videoAPI.playStream(this.childProcess);
		} else {
			await this.videoAPI.playVideo(this.childProcess);
		}
		this.finished = false;
		this.state = State.PLAYING;
		await playingPromise;
		await wait(500);
	}

	public async pause() {
		if (!this.childProcess) {
			throw new Error('Trying to pause video that\'s not prepared, video key: ' + this.key);
		}

		if (this.isStream) {
			await this.videoAPI.pauseStream(this.childProcess);
		} else {
			await this.videoAPI.pauseVideo(this.childProcess);
		}
	}

	public async resume() {
		if (!this.childProcess) {
			throw new Error('Trying to resume video that\'s not prepared, video key: ' + this.key);
		}

		if (this.isStream) {
			await this.videoAPI.resumeStream(this.childProcess);
		} else {
			await this.videoAPI.resumeVideo(this.childProcess);
		}
	}

	public async stop() {
		if (!this.childProcess) {
			throw new Error('Trying to stop video that\'s not running, video key: ' + this.key);
		}

		if (!this.finished) {
			if (this.isStream) {
				await this.videoAPI.stopStream(this.childProcess);
			} else {
				await this.videoAPI.stopVideo(this.childProcess);
			}
		}

		this.videoEventListener.removeAllListeners();
		this.state = State.IDLE;
		this.childProcess = null;
		this.videoArguments = null;
		this.finished = false;
		this.isStream = false;
	}

	public isIdle() {
		return this.state === State.IDLE;
	}

	public isPlaying() {
		return this.state === State.PLAYING;
	}

	public addEventListener(eventName: string, listener: (event: IVideoEvent) => void) {
		this.eventEmitter.on(eventName, listener);
	}

	private async prepareVideoChildProcess(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		isStream: boolean,
		options: IOptions,
	) {
		const socketPath = this.videoEventListener.getSocketPath();
		const volume = await this.getAbsoluteVolume(options);
		const orientation = await this.getVideoOrientation();
		let videoProcess: ChildProcess;
		if (isStream) {
			debug(`prepare stream, uri: ${uri}, x: ${x}, y: ${y}, width: ${width}, height: ${height}`);
			videoProcess = this.videoAPI.prepareStream(uri, x, y, width, height, orientation, socketPath, volume);
			debug(`stream prepared, uri: ${uri}, pid: ${videoProcess.pid}`);
		} else {
			debug(`prepare video, uri: ${uri}, x: ${x}, y: ${y}, width: ${width}, height: ${height}`);
			const filePath = await this.fileSystem.convertRelativePathToFilePath(uri);
			const fileAbsolutePath = this.fileSystem.getAbsolutePath(filePath);
			videoProcess = this.videoAPI.prepareVideo(fileAbsolutePath, x, y, width, height, orientation, socketPath, volume);
			debug(`video prepared, uri: ${uri}, pid: ${videoProcess.pid}`);
		}

		const videoEventSrcArgs = { uri, x, y, width, height };

		videoProcess.once('close', (code: number, signal: string | null) => {
			debug(`video process closed, uri: ${uri}, code: ${code}, signal: ${signal}`);
			this.state = State.IDLE;
			this.finished = true;
			if (signal !== null) {
				this.eventEmitter.emit('stopped', { type: 'stopped', srcArguments: videoEventSrcArgs });
			} else if (code !== 0) {
				this.eventEmitter.emit('error', {
					type: 'error',
					srcArguments: videoEventSrcArgs,
					data: {
						message: 'Process finished with exit code ' + code,
					},
				});
			}
		});

		videoProcess.on('error', (error: Error) => {
			console.error('video error', error, { uri, x, y, width, height });
		});

		this.videoEventListener.on('ended', () => {
			debug(`video ended, uri: ${uri}`);
			this.eventEmitter.emit('ended', { type: 'ended', srcArguments: videoEventSrcArgs });
		});

		return videoProcess;
	}

	private async getAbsoluteVolume(options: IOptions) {
		const systemVolume = await this.systemSettings.getVolume();
		if (typeof options.volume === 'undefined') {
			return systemVolume;
		}
		const absoluteVolume = (options.volume / 100) * systemVolume;
		return Math.trunc(absoluteVolume);
	}

	private async getVideoOrientation(): Promise<Orientation> {
		const videoOrientation = await this.systemSettings.getVideoOrientation();
		if (videoOrientation !== null) {
			return Orientation[VideoOrientation[videoOrientation] as keyof typeof Orientation];
		} else {
			return await this.systemSettings.getScreenOrientation();
		}
	}
}
