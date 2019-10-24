import { EventEmitter } from 'events';
import IVideoPlayer from '@signageos/front-display/es6/Video/IVideoPlayer';
import IVideo from '@signageos/front-display/es6/Video/IVideo';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';
import BridgeVideoClient from '../../Bridge/BridgeVideoClient';

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
	public async prepare(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		const uriRelative = this.stripFileSystemRootFromUri(uri);
		await this.bridgeVideoClient.prepareVideo(uriRelative, x, y, width, height, false);
	}

	@locked('video')
	public async play(uri: string, x: number, y: number, width: number, height: number): Promise<IVideo> {
		const uriRelative = this.stripFileSystemRootFromUri(uri);
		const videoEventEmitter = await this.bridgeVideoClient.playVideo(uriRelative, x, y, width, height, false);
		return this.convertEventEmitterWithRelativeUriToAbsoluteUri(videoEventEmitter);
	}

	@locked('video')
	public async stop(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		const uriRelative = this.stripFileSystemRootFromUri(uri);
		await this.bridgeVideoClient.stopVideo(uriRelative, x, y, width, height);
	}

	@locked('video')
	public pause(_uri: string, _x: number, _y: number, _width: number, _height: number): Promise<void> {
		throw new Error('Not implemented'); // TODO
	}

	@locked('video')
	public resume(_uri: string, _x: number, _y: number, _width: number, _height: number): Promise<void> {
		throw new Error('Not implemented'); // TODO
	}

	@locked('video')
	public async clearAll(): Promise<void> {
		await this.bridgeVideoClient.clearAll();
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
