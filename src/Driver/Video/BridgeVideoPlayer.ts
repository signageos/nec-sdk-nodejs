import { EventEmitter } from 'events';
import * as AsyncLock from 'async-lock';
import IVideoPlayer from '@signageos/front-display/es6/Video/IVideoPlayer';
import IVideo from '@signageos/front-display/es6/Video/IVideo';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import BridgeClient from '../../Bridge/BridgeClient';
import {
	PlayVideo,
	StopVideo,
	StopAllVideos,
	VideoStarted,
	VideoEnded,
	VideoStopped,
	VideoError,
	AllVideosStopped,
} from '../../Bridge/bridgeVideoMessages';
import { checksumString } from '../../../node_modules/@signageos/front-display/es6/Hash/checksum';

export default class BridgeVideoPlayer implements IVideoPlayer {

	private playingVideos: { [videoId: string]: EventEmitter } = {};

	private static getVideoIdentificator(uri: string, x: number, y: number, width: number, height: number) {
		return checksumString(uri) + '_' + x + 'x' + y + '-' + width + 'x' + height;
	}

	constructor(
		private fileSystemUrl: string,
		private lock: AsyncLock,
		private bridge: BridgeClient,
	) {
		this.listenToVideoEvents();
	}

	public async prepare(_uri: string, _x: number, _y: number, _width: number, _height: number): Promise<void> {
		// do nothing
	}

	public async play(uri: string, x: number, y: number, width: number, height: number): Promise<IVideo> {
		return await this.lock.acquire('video', async () => {
			const uriRelative = this.stripFileSystemRootFromUri(uri);
			const videoId = BridgeVideoPlayer.getVideoIdentificator(uriRelative, x, y, width, height);
			if (this.playingVideos[videoId]) {
				throw new Error(`Video is already playing: ${uri}, ${x}, ${y}, ${width}, ${height}`);
			}

			const videoEmitter = new EventEmitter();
			const resultRacePromise = Promise.race([
				new Promise<void>((resolve: () => void) => {
					videoEmitter.once('started', resolve);
				}),
				new Promise<void>((_resolve: () => void, reject: (error: Error) => void) => {
					videoEmitter.once('error', () => reject(new Error('Failed to play video')));
				}),
			] as Promise<void>[]);

			this.playingVideos[videoId] = videoEmitter;
			this.bridge.socketClient.emit(PlayVideo, { uri: uriRelative, x, y, width, height });

			try {
				await resultRacePromise;
			} catch (error) {
				delete this.playingVideos[videoId];
				throw error;
			}

			return videoEmitter;
		});
	}

	public async stop(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		await this.lock.acquire('video', async () => {
			const uriRelative = this.stripFileSystemRootFromUri(uri);
			const videoId = BridgeVideoPlayer.getVideoIdentificator(uriRelative, x, y, width, height);
			if (!this.playingVideos[videoId]) {
				throw new Error(`Video is not playing: ${uri}, ${x}, ${y}, ${width}, ${height}`);
			}

			const videoEmitter = this.playingVideos[videoId];
			const resultRacePromise = Promise.race([
				new Promise<void>((resolve: () => void) => videoEmitter.once('stopped', resolve)),
				new Promise<void>((resolve: () => void) => videoEmitter.once('error', resolve)),
			] as Promise<void>[]);

			this.bridge.socketClient.emit(StopVideo, { uri: uriRelative, x, y, width, height });
			await resultRacePromise;
			delete this.playingVideos[videoId];
		});
	}

	public pause(_uri: string, _x: number, _y: number, _width: number, _height: number): Promise<void> {
		throw new Error('Not implemented');
	}

	public resume(_uri: string, _x: number, _y: number, _width: number, _height: number): Promise<void> {
		throw new Error('Not implemented');
	}

	public async clearAll(): Promise<void> {
		await this.lock.acquire('video', async () => {
			const resultPromise = new Promise<void>((resolve: () => void) => {
				this.bridge.socketClient.once(AllVideosStopped, resolve);
			});

			this.bridge.socketClient.emit(StopAllVideos, {});
			await resultPromise;
			this.playingVideos = {};
		});
	}

	private listenToVideoEvents() {
		const socketClient = this.bridge.socketClient;
		socketClient.on(VideoStarted, async (event: VideoStarted) => {
			await this.emitVideoEvent('started', event);
		});
		socketClient.on(VideoEnded, async (event: VideoEnded) => {
			await this.emitVideoEvent('ended', event);
		});
		socketClient.on(VideoStopped, async (event: VideoStopped) => {
			await this.emitVideoEvent('stopped', event);
		});
		socketClient.on(VideoError, async (event: VideoError) => {
			await this.emitVideoEvent('error', event);
		});
	}

	private async emitVideoEvent(
		type: string,
		event: VideoStarted | VideoEnded | VideoStopped | VideoError,
	) {
		const { uri, x, y, width, height } = event;
		const videoId = BridgeVideoPlayer.getVideoIdentificator(uri, x, y, width, height);
		if (this.playingVideos[videoId]) {
			this.playingVideos[videoId].emit(
				type,
				{
					type,
					srcArguments: {
						uri: this.fileSystemUrl + '/' + uri,
						x, y, width, height,
					},
					data: (event as any).data,
				} as IVideoEvent,
			);
		}
	}

	private stripFileSystemRootFromUri(uri: string) {
		if (uri.startsWith(this.fileSystemUrl + '/')) {
			const skipChars = (this.fileSystemUrl + '/').length;
			return uri.substring(skipChars);
		}

		throw new Error('Videos can only be played from local storage. Supply full URI.');
	}
}
