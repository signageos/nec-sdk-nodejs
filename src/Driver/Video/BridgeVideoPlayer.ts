import { EventEmitter } from 'events';
import { debug } from '@signageos/lib/dist/Debug/debugDecorator';
import IVideoPlayer, { IOptions } from '@signageos/front-display/es6/Video/IVideoPlayer';
import IVideoEventEmitter from '@signageos/front-display/es6/Video/IVideoEventEmitter';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';
import BridgeVideoClient from '../../Bridge/BridgeVideoClient';

const DEBUG_NAMESPACE = '@signageos/display-linux:Driver:Video:BridgeVideoPlayer';

export default class BridgeVideoPlayer implements IVideoPlayer {

	constructor(
		private fileSystemUrl: string,
		private bridgeVideoClient: BridgeVideoClient,
		private maxVideoCount: number,
	) {}

	public getMaxVideoCount(): number {
		return this.maxVideoCount;
	}

	@locked('video')
	@debug(DEBUG_NAMESPACE)
	public async prepare(uri: string, x: number, y: number, width: number, height: number, options: IOptions = {}): Promise<void> {
		const uriRelative = this.stripFileSystemRootFromUri(uri);
		await this.bridgeVideoClient.prepareVideo(uriRelative, x, y, width, height, false, options);
	}

	@locked('video')
	@debug(DEBUG_NAMESPACE)
	public async play(uri: string, x: number, y: number, width: number, height: number): Promise<IVideoEventEmitter> {
		const uriRelative = this.stripFileSystemRootFromUri(uri);
		const videoEventEmitter = await this.bridgeVideoClient.playVideo(uriRelative, x, y, width, height, false);
		return this.convertEventEmitterWithRelativeUriToAbsoluteUri(videoEventEmitter);
	}

	@locked('video')
	@debug(DEBUG_NAMESPACE)
	public async stop(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		const uriRelative = this.stripFileSystemRootFromUri(uri);
		await this.bridgeVideoClient.stopVideo(uriRelative, x, y, width, height);
	}

	@locked('video')
	@debug(DEBUG_NAMESPACE)
	public async pause(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		const uriRelative = this.stripFileSystemRootFromUri(uri);
		await this.bridgeVideoClient.pauseVideo(uriRelative, x, y, width, height);
	}

	@locked('video')
	@debug(DEBUG_NAMESPACE)
	public async resume(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		const uriRelative = this.stripFileSystemRootFromUri(uri);
		await this.bridgeVideoClient.resumeVideo(uriRelative, x, y, width, height);
	}

	@locked('video')
	@debug(DEBUG_NAMESPACE)
	public async clearAll(): Promise<void> {
		await this.bridgeVideoClient.clearAll();
	}

	private stripFileSystemRootFromUri(uri: string) {
		if (uri.startsWith(this.fileSystemUrl + '/')) {
			const skipChars = (this.fileSystemUrl + '/').length;
			return decodeURI(uri.substring(skipChars));
		}

		throw new Error('Videos can only be played from local storage. Supply full URI.');
	}

	private prependUriWithFileSystemRoot(uri: string) {
		return this.fileSystemUrl + '/' + encodeURI(uri);
	}

	private convertEventEmitterWithRelativeUriToAbsoluteUri(videoEmitter: IVideoEventEmitter) {
		const convertedVideoEmitter = new EventEmitter();
		const convertEvent = (event: IVideoEvent) => ({
			...event,
			srcArguments: {
				...event.srcArguments,
				uri: this.prependUriWithFileSystemRoot(event.srcArguments.uri),
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
