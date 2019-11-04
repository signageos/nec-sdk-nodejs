import { EventEmitter } from "events";
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';
import IVideo from '@signageos/front-display/es6/Video/IVideo';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import {
	PlayVideo,
	PrepareVideo,
	PauseVideo,
	ResumeVideo,
	StopAllVideos,
	StopVideo,
	VideoEnded,
	VideoError,
	VideoStopped,
} from './bridgeVideoMessages';
import {
	getVideoIdentificator,
	convertToLandscapeFlipped,
	convertToPortrait,
	convertToPortraitFlipped,
	Coordinates,
} from '../Driver/Video/helper';
import BridgeClient, { MessageType } from './BridgeClient';

export default class BridgeVideoClient {

	private playingVideos: { [videoId: string]: EventEmitter } = {};

	constructor(
		private window: Window,
		private getOrientation: () => Promise<Orientation>,
		private bridge: BridgeClient,
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
		const coordinates = await this.convertCoordinatesForOrientation(x, y, width, height);
		const orientation = await this.getOrientation();
		await this.bridge.invoke<PrepareVideo, {}>(
			{ type: PrepareVideo, uri, ...coordinates, orientation, isStream },
			MessageType.VIDEO,
		);
	}

	public async playVideo(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		isStream: boolean,
	): Promise<IVideo> {
		const coordinates = await this.convertCoordinatesForOrientation(x, y, width, height);
		const orientation = await this.getOrientation();
		await this.bridge.invoke<PlayVideo, {}>(
			{ type: PlayVideo, uri, ...coordinates, orientation, isStream },
			MessageType.VIDEO,
		);
		const videoEmitter = new EventEmitter();
		const videoId = await this.getVideoId(uri, x, y, width, height);
		this.playingVideos[videoId] = videoEmitter;

		if (orientation === Orientation.LANDSCAPE) {
			return videoEmitter;
		} else {
			return this.convertEventEmitterWithConvertedCoordinatesBackToOriginalCoordinates(videoEmitter, x, y, width, height);
		}
	}

	public async pauseVideo(uri: string, x: number, y: number, width: number, height: number) {
		const coordinates = await this.convertCoordinatesForOrientation(x, y, width, height);
		await this.bridge.invoke<PauseVideo, {}>(
			{ type: PauseVideo, uri, ...coordinates },
			MessageType.VIDEO,
		);
	}

	public async resumeVideo(uri: string, x: number, y: number, width: number, height: number) {
		const coordinates = await this.convertCoordinatesForOrientation(x, y, width, height);
		await this.bridge.invoke<ResumeVideo, {}>(
			{ type: ResumeVideo, uri, ...coordinates },
			MessageType.VIDEO,
		);
	}

	public async stopVideo(uri: string, x: number, y: number, width: number, height: number) {
		const coordinates = await this.convertCoordinatesForOrientation(x, y, width, height);
		await this.bridge.invoke<StopVideo, {}>(
			{ type: StopVideo, uri, ...coordinates },
			MessageType.VIDEO,
		);
		const videoId = await this.getVideoId(uri, x, y, width, height);
		delete this.playingVideos[videoId];
	}

	public async clearAll() {
		await this.bridge.invoke<StopAllVideos, {}>({ type: StopAllVideos }, MessageType.VIDEO);
		this.playingVideos = {};
	}

	private async getVideoId(uri: string, x: number, y: number, width: number, height: number): Promise<string> {
		const coordinates = await this.convertCoordinatesForOrientation(x, y, width, height);
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

	private async convertCoordinatesForOrientation(
		x: number,
		y: number,
		width: number,
		height: number,
	): Promise<Coordinates> {
		const orientation = await this.getOrientation();
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
