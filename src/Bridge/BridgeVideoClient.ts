import { EventEmitter } from "events";
import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';
import IVideoEventEmitter from '@signageos/front-display/es6/Video/IVideoEventEmitter';
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
import BridgeClient, { MessageType } from './BridgeClient';
import { IOptions } from '@signageos/front-display/es6/Video/IVideoPlayer';
import { checksumString } from '@signageos/front-display/es6/Hash/checksum';

export default class BridgeVideoClient {

	private playingVideos: { [videoId: string]: EventEmitter } = {};

	constructor(
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
		options: IOptions = {},
	) {
		await this.bridge.invoke<PrepareVideo, {}>(
			{ type: PrepareVideo, uri, x, y, width, height, isStream, options },
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
	): Promise<IVideoEventEmitter> {
		await this.bridge.invoke<PlayVideo, {}>(
			{ type: PlayVideo, uri, x, y, width, height, isStream },
			MessageType.VIDEO,
		);
		const videoEmitter = new EventEmitter();
		const videoId = this.getVideoId(uri, x, y, width, height);
		this.playingVideos[videoId] = videoEmitter;
		return videoEmitter;
	}

	public async pauseVideo(uri: string, x: number, y: number, width: number, height: number) {
		await this.bridge.invoke<PauseVideo, {}>(
			{ type: PauseVideo, uri, x, y, width, height },
			MessageType.VIDEO,
		);
	}

	public async resumeVideo(uri: string, x: number, y: number, width: number, height: number) {
		await this.bridge.invoke<ResumeVideo, {}>(
			{ type: ResumeVideo, uri, x, y, width, height },
			MessageType.VIDEO,
		);
	}

	public async stopVideo(uri: string, x: number, y: number, width: number, height: number) {
		await this.bridge.invoke<StopVideo, {}>(
			{ type: StopVideo, uri, x, y, width, height },
			MessageType.VIDEO,
		);
		const videoId = await this.getVideoId(uri, x, y, width, height);
		delete this.playingVideos[videoId];
	}

	public async clearAll() {
		await this.bridge.invoke<StopAllVideos, {}>({ type: StopAllVideos }, MessageType.VIDEO);
		this.playingVideos = {};
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
		const videoId = this.getVideoId(uri, x, y, width, height);
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

	private getVideoId(uri: string, x: number, y: number, width: number, height: number) {
		return checksumString(uri) + '_' + x + 'x' + y + '-' + width + 'x' + height;
	}
}
