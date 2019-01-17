import { EventEmitter } from "events";
import * as AsyncLock from 'async-lock';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import ISocket from '@signageos/front-display/es6/Socket/ISocket';
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
import {
	convertToLandscapeFlipped,
	convertToPortrait,
	convertToPortraitFlipped,
	Coordinates,
	getVideoIdentificator,
} from '../Driver/Video/helper';

export default class BridgeVideoClient {

	private playingVideos: { [videoId: string]: EventEmitter } = {};

	constructor(
		private window: Window,
		private getOrientation: () => Orientation,
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
		const coordinates = this.convertCoordinatesForOrientation(x, y, width, height);

		const resultPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			let successListener: (message: any) => void;
			let errorListener: (message: any) => void;

			successListener = (event: VideoPrepared) => {
				if (event.uri === uri &&
					event.x === coordinates.x &&
					event.y === coordinates.y &&
					event.width === coordinates.width &&
					event.height === coordinates.height
				) {
					this.socketClient.removeListener(VideoPrepared, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					resolve();
				}
			};

			errorListener = (event: VideoError) => {
				if (event.uri === uri &&
					event.x === coordinates.x &&
					event.y === coordinates.y &&
					event.width === coordinates.width &&
					event.height === coordinates.height
				) {
					this.socketClient.removeListener(VideoPrepared, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					reject(new Error('Failed to prepare video'));
				}
			};

			this.socketClient.on(VideoPrepared, successListener);
			this.socketClient.on(VideoError, errorListener);
		});

		const orientation = this.getOrientation();
		this.socketClient.emit(PrepareVideo, { uri, ...coordinates, orientation, isStream });
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
		const coordinates = this.convertCoordinatesForOrientation(x, y, width, height);

		const resultPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			let successListener: (message: any) => void;
			let errorListener: (message: any) => void;

			successListener = (event: VideoStarted) => {
				if (event.uri === uri &&
					event.x === coordinates.x &&
					event.y === coordinates.y &&
					event.width === coordinates.width &&
					event.height === coordinates.height
				) {
					this.socketClient.removeListener(VideoStarted, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					resolve();
				}
			};

			errorListener = (event: VideoError) => {
				if (event.uri === uri &&
					event.x === coordinates.x &&
					event.y === coordinates.y &&
					event.width === coordinates.width &&
					event.height === coordinates.height
				) {
					this.socketClient.removeListener(VideoStarted, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					reject(new Error('Failed to play video'));
				}
			};

			this.socketClient.on(VideoStarted, successListener);
			this.socketClient.on(VideoError, errorListener);
		});

		const orientation = this.getOrientation();
		this.socketClient.emit(PlayVideo, { uri, ...coordinates, orientation, isStream });
		await resultPromise;

		const videoEmitter = new EventEmitter();
		const videoId = this.getVideoId(uri, x, y, width, height);
		this.playingVideos[videoId] = videoEmitter;

		if (orientation === Orientation.LANDSCAPE) {
			return videoEmitter;
		} else {
			return this.convertEventEmitterWithConvertedCoordinatesBackToOriginalCoordinates(videoEmitter, x, y, width, height);
		}
	}

	public async stopVideo(uri: string, x: number, y: number, width: number, height: number) {
		const coordinates = this.convertCoordinatesForOrientation(x, y, width, height);

		const resultPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			let successListener: (message: any) => void;
			let errorListener: (message: any) => void;

			successListener = (event: VideoStopped) => {
				if (event.uri === uri &&
					event.x === coordinates.x &&
					event.y === coordinates.y &&
					event.width === coordinates.width &&
					event.height === coordinates.height
				) {
					this.socketClient.removeListener(VideoStopped, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					resolve();
				}
			};

			errorListener = (event: VideoError) => {
				if (event.uri === uri &&
					event.x === coordinates.x &&
					event.y === coordinates.y &&
					event.width === coordinates.width &&
					event.height === coordinates.height
				) {
					this.socketClient.removeListener(VideoStopped, successListener);
					this.socketClient.removeListener(VideoError, errorListener);
					reject(new Error('Failed to stop video'));
				}
			};

			this.socketClient.on(VideoStopped, successListener);
			this.socketClient.on(VideoError, errorListener);
		});

		this.socketClient.emit(StopVideo, { uri, ...coordinates });
		await resultPromise;

		const videoId = this.getVideoId(uri, x, y, width, height);
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

	private getVideoId(uri: string, x: number, y: number, width: number, height: number): string {
		const coordinates = this.convertCoordinatesForOrientation(x, y, width, height);
		return getVideoIdentificator(uri, coordinates.x, coordinates.y, coordinates.width, coordinates.height);
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

	private convertCoordinatesForOrientation(
		x: number,
		y: number,
		width: number,
		height: number,
	): Coordinates {
		const orientation = this.getOrientation();
		switch (orientation) {
			case Orientation.PORTRAIT:
				return convertToPortrait(this.window, x, y, width, height);
			case Orientation.PORTRAIT_FLIPPED:
				return convertToPortraitFlipped(this.window, x, y, width, height);
			case Orientation.LANDSCAPE_FLIPPED:
				return convertToLandscapeFlipped(this.window, x, y, width, height);
			default:
				return { x, y, width, height };
		}
	}

	private convertEventEmitterWithConvertedCoordinatesBackToOriginalCoordinates(
		videoEmitter: IVideo,
		originalX: number,
		originalY: number,
		originalWidth: number,
		originalHeight: number,
	): IVideo {
		const convertedVideoEmitter = new EventEmitter();
		const convertEvent = (event: IVideoEvent) => ({
			...event,
			srcArguments: {
				uri: event.srcArguments.uri,
				x: originalX,
				y: originalY,
				width: originalWidth,
				height: originalHeight,
			},
		});

		videoEmitter.on('ended', (event: IVideoEvent) => convertedVideoEmitter.emit('ended', convertEvent(event)));
		videoEmitter.on('error', (event: IVideoEvent) => convertedVideoEmitter.emit('error', convertEvent(event)));
		videoEmitter.on('stopped', (event: IVideoEvent) => convertedVideoEmitter.emit('stopped', convertEvent(event)));

		// "error" event type is treated as a special case and has to have at least one listener or it can crash the whole process
		// https://nodejs.org/api/events.html#events_error_events
		convertedVideoEmitter.on('error', () => { /* do nothing */ });

		return convertedVideoEmitter;
	}
}
