import { EventEmitter } from 'events';
import * as AsyncLock from 'async-lock';
import IVideoPlayer from '@signageos/front-display/es6/Video/IVideoPlayer';
import IVideo from '@signageos/front-display/es6/Video/IVideo';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import BridgeClient from '../../Bridge/BridgeClient';
import {
	getLastFramePathFromVideoPath,
	getVideoIdentificator,
} from './helper';

export default class BridgeVideoPlayer implements IVideoPlayer {

	private videoLastFrameIds: string[] = [];

	constructor(
		private window: Window,
		private fileSystemUrl: string,
		private lock: AsyncLock,
		private bridge: BridgeClient,
	) {}

	public async prepare(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		return await this.lock.acquire('video', async () => {
			const uriRelative = this.stripFileSystemRootFromUri(uri);

			if (this.bridge.video.isVideoPlaying(uriRelative, x, y, width, height)) {
				throw new Error(`Video is already playing: ${uri}, ${x}, ${y}, ${width}, ${height}`);
			}

			await this.bridge.video.prepareVideo(uriRelative, x, y, width, height);
			this.prepareLastFrame(uri, x, y, width, height);
		});
	}

	public async play(uri: string, x: number, y: number, width: number, height: number): Promise<IVideo> {
		return await this.lock.acquire('video', async () => {
			const uriRelative = this.stripFileSystemRootFromUri(uri);

			if (this.bridge.video.isVideoPlaying(uriRelative, x, y, width, height)) {
				throw new Error(`Video is already playing: ${uri}, ${x}, ${y}, ${width}, ${height}`);
			}

			await this.bridge.video.prepareVideo(uriRelative, x, y, width, height);
			this.prepareLastFrame(uri, x, y, width, height);
			const videoEventEmitter = await this.bridge.video.playVideo(uriRelative, x, y, width, height, false);
			this.showLastFrame(uri, x, y, width, height);

			return this.convertEventEmitterWithRelativeUriToAbsoluteUri(videoEventEmitter);
		});
	}

	public async stop(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		await this.lock.acquire('video', async () => {
			const uriRelative = this.stripFileSystemRootFromUri(uri);
			await this.bridge.video.stopVideo(uriRelative, x, y, width, height, false);
			this.destroyLastFrame(uri, x, y, width, height);
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
			this.destroyAllLastFrames();
		});
	}

	private prepareLastFrame(uri: string, x: number, y: number, width: number, height: number) {
		const videoId = getVideoIdentificator(uri, x, y, width, height);

		if (this.videoLastFrameIds.indexOf(videoId) >= 0) {
			return;
		}

		const imageSrc = getLastFramePathFromVideoPath(uri);
		const lastFrameElement = this.window.document.createElement('div');
		lastFrameElement.id = videoId;
		lastFrameElement.style.position = 'absolute';
		lastFrameElement.style.left = x + 'px';
		lastFrameElement.style.top = y + 'px';
		lastFrameElement.style.width = width + 'px';
		lastFrameElement.style.height = height + 'px';
		lastFrameElement.style.backgroundImage = `url(${imageSrc})`;
		lastFrameElement.style.backgroundRepeat = 'no-repeat';
		lastFrameElement.style.backgroundSize = 'contain';
		lastFrameElement.style.backgroundPosition = 'center';
		lastFrameElement.style.visibility = 'hidden';
		this.window.document.getElementById('body')!.appendChild(lastFrameElement);

		this.videoLastFrameIds.push(videoId);
	}

	private showLastFrame(uri: string, x: number, y: number, width: number, height: number) {
		const videoId = getVideoIdentificator(uri, x, y, width, height);
		const lastFrameElement = this.window.document.getElementById(videoId);
		if (lastFrameElement) {
			lastFrameElement.style.visibility = 'visible';
		}
	}

	private destroyLastFrame(uri: string, x: number, y: number, width: number, height: number) {
		const videoId = getVideoIdentificator(uri, x, y, width, height);
		const lastFrameElement = this.window.document.getElementById(videoId);
		if (lastFrameElement) {
			this.window.document.getElementById('body')!.removeChild(lastFrameElement);
		}

		this.videoLastFrameIds = this.videoLastFrameIds.filter((lastFrameId: string) => lastFrameId !== videoId);
	}

	private destroyAllLastFrames() {
		const body = this.window.document.getElementById('body')!;
		for (let videoId of this.videoLastFrameIds) {
			const lastFrameElement = this.window.document.getElementById(videoId);
			if (lastFrameElement) {
				body.removeChild(lastFrameElement);
			}
		}

		this.videoLastFrameIds = [];
	}

	private stripFileSystemRootFromUri(uri: string) {
		if (uri.startsWith(this.fileSystemUrl + '/')) {
			const skipChars = (this.fileSystemUrl + '/').length;
			return uri.substring(skipChars);
		}

		throw new Error('Videos can only be played from local storage. Supply full URI.');
	}

	private convertEventEmitterWithRelativeUriToAbsoluteUri(videoEmitter: IVideo) {
		const convertedVideoEmitter = new EventEmitter();
		const convertEvent = (event: IVideoEvent) => ({
			...event,
			srcArguments: {
				...event.srcArguments,
				uri: this.fileSystemUrl + '/' + event.srcArguments.uri,
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
