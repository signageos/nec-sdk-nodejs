import { EventEmitter } from "events";
import * as AsyncLock from 'async-lock';
import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';
import IVideo from '@signageos/front-display/es6/Video/IVideo';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import {
	AllVideosStopped,
	PlayVideo,
	PrepareVideo,
	StopAllVideos,
	StopVideo,
	VideoEnded,
	VideoError,
	VideoPrepared,
	VideoStarted,
	VideoStopped,
} from './bridgeVideoMessages';
import { getVideoIdentificator } from '../Driver/Video/helper';

export default class BridgeVideoClient {

	private playingVideos: { [videoId: string]: EventEmitter } = {};

	constructor(
		private lock: AsyncLock,
		private socketClient: ISocket,
	) {
		this.listenToVideoEvents();
	}

	public async prepareVideo(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		isStream: boolean,
	) {
		const resultPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			let successListener: (message: any) => void;
			let errorListener: (message: any) => void;

			successListener = (event: VideoPrepared) => {
				if (event.uri === uri &&
					event.x === x &&
					event.y === y &&
					event.width === width &&
					event.height === height
				) {
					this.socketClient.removeListener(VideoPrepared, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					resolve();
				}
			};

			errorListener = (event: VideoError) => {
				if (event.uri === uri &&
					event.x === x &&
					event.y === y &&
					event.width === width &&
					event.height === height
				) {
					this.socketClient.removeListener(VideoPrepared, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					reject(new Error('Failed to prepare video'));
				}
			};

			this.socketClient.on(VideoPrepared, successListener);
			this.socketClient.on(VideoError, errorListener);
		});

		this.socketClient.emit(PrepareVideo, { uri, x, y, width, height, isStream });
		await resultPromise;
	}

	public async playVideo(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		isStream: boolean,
	): Promise<IVideo> {
		const resultPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			let successListener: (message: any) => void;
			let errorListener: (message: any) => void;

			successListener = (event: VideoStarted) => {
				if (event.uri === uri &&
					event.x === x &&
					event.y === y &&
					event.width === width &&
					event.height === height
				) {
					this.socketClient.removeListener(VideoStarted, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					resolve();
				}
			};

			errorListener = (event: VideoError) => {
				if (event.uri === uri &&
					event.x === x &&
					event.y === y &&
					event.width === width &&
					event.height === height
				) {
					this.socketClient.removeListener(VideoStarted, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					reject(new Error('Failed to play video'));
				}
			};

			this.socketClient.on(VideoStarted, successListener);
			this.socketClient.on(VideoError, errorListener);
		});

		this.socketClient.emit(PlayVideo, { uri, x, y, width, height, isStream });
		await resultPromise;

		const videoEmitter = new EventEmitter();
		const videoId = getVideoIdentificator(uri, x, y, width, height);
		this.playingVideos[videoId] = videoEmitter;
		return videoEmitter;
	}

	public async stopVideo(uri: string, x: number, y: number, width: number, height: number) {
		const resultPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			let successListener: (message: any) => void;
			let errorListener: (message: any) => void;

			successListener = (event: VideoStopped) => {
				if (event.uri === uri &&
					event.x === x &&
					event.y === y &&
					event.width === width &&
					event.height === height
				) {
					this.socketClient.removeListener(VideoStopped, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					resolve();
				}
			};

			errorListener = (event: VideoError) => {
				if (event.uri === uri &&
					event.x === x &&
					event.y === y &&
					event.width === width &&
					event.height === height
				) {
					this.socketClient.removeListener(VideoStopped, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					reject(new Error('Failed to stop video'));
				}
			};

			this.socketClient.on(VideoStopped, successListener);
			this.socketClient.on(VideoError, errorListener);
		});

		this.socketClient.emit(StopVideo, { uri, x, y, width, height });
		await resultPromise;

		const videoId = getVideoIdentificator(uri, x, y, width, height);
		delete this.playingVideos[videoId];
	}

	public async clearAll() {
		await this.lock.acquire('video', async () => {
			const resultPromise = new Promise<void>((resolve: () => void) => {
				this.socketClient.once(AllVideosStopped, resolve);
			});

			this.socketClient.emit(StopAllVideos, {});
			await resultPromise;

			this.playingVideos = {};
		});
	}

	private listenToVideoEvents() {
		const socketClient = this.socketClient;
		socketClient.on(VideoEnded, (event: VideoEnded) => {
			this.emitVideoEvent('ended', event);
		});
		socketClient.on(VideoStopped, (event: VideoStopped) => {
			this.emitVideoEvent('stopped', event);
		});
		socketClient.on(VideoError, (event: VideoError) => {
			this.emitVideoEvent('error', event);
		});
	}

	private emitVideoEvent(
		type: string,
		event: VideoEnded | VideoStopped | VideoError,
	) {
		const { uri, x, y, width, height } = event;
		const videoId = getVideoIdentificator(uri, x, y, width, height);
		if (this.playingVideos[videoId]) {
			this.playingVideos[videoId].emit(
				type,
				{
					type,
					srcArguments: {
						uri, x, y, width, height,
					},
					data: (event as any).data,
				} as IVideoEvent,
			);
		}
	}
}
