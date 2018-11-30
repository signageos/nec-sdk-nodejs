import { EventEmitter } from 'events';
import IStreamPlayer from '@signageos/front-display/es6/Stream/IStreamPlayer';
import StreamProtocol from '@signageos/front-display/es6/Stream/StreamProtocol';
import IStream from '@signageos/front-display/es6/Stream/IStream';
import IVideo from '@signageos/front-display/es6/Video/IVideo';
import BridgeVideoClient from '../../Bridge/BridgeVideoClient';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';
import { IStreamClosedEvent, IStreamErrorEvent } from '@signageos/front-display/es6/Stream/streamEvents';

export default class BridgeStreamPlayer implements IStreamPlayer {

	constructor(
		private bridgeVideoClient: BridgeVideoClient,
	) {}

	@locked('video')
	public async play(uri: string, x: number, y: number, width: number, height: number, protocol: StreamProtocol): Promise<IStream> {
		if (uri.startsWith('internal://')) {
			throw new Error('Playing from internal port is not supported');
		}

		if (!this.isStreamingProtocolSupported(protocol)) {
			throw new Error('Streaming protocol is not supported');
		}

		const videoEmitter = await this.bridgeVideoClient.playVideo(uri, x, y, width, height, true);
		return this.convertVideoEventEmitterToStreamEventEmitter(videoEmitter, protocol);
	}

	@locked('video')
	public async stop(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		await this.bridgeVideoClient.stopVideo(uri, x, y, width, height);
	}

	@locked('video')
	public async clearAll(): Promise<void> {
		// do nothing
	}

	private isStreamingProtocolSupported(protocol: StreamProtocol) {
		const supportedProtocols = [
			StreamProtocol.HTTP,
			StreamProtocol.UDP,
			StreamProtocol.HLS,
			StreamProtocol.RTSP,
		];

		return supportedProtocols.indexOf(protocol) >= 0;
	}

	private convertVideoEventEmitterToStreamEventEmitter(videoEmitter: IVideo, protocol: StreamProtocol): IStream {
		const streamEmitter = new EventEmitter();

		videoEmitter.on('error', (event: IVideoEvent) => streamEmitter.emit('error', {
			type: 'error',
			...event.srcArguments,
			protocol,
			errorMessage: 'Error occurred during stream playback',
		} as IStreamErrorEvent));

		videoEmitter.on('stopped', (event: IVideoEvent) => streamEmitter.emit('closed', {
			type: 'closed',
			...event.srcArguments,
			protocol,
		} as IStreamClosedEvent));

		// TODO implement connected/disconnected events

		return streamEmitter;
	}
}
