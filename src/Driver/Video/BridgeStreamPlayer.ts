import { EventEmitter } from 'events';
import IStreamPlayer from '@signageos/front-display/es6/Stream/IStreamPlayer';
import StreamProtocol from '@signageos/front-display/es6/Stream/StreamProtocol';
import IStream from '@signageos/front-display/es6/Stream/IStream';
import StreamURI from '@signageos/front-display/es6/Stream/StreamURI';
import IVideoEventEmitter from '@signageos/front-display/es6/Video/IVideoEventEmitter';
import BridgeVideoClient from '../../Bridge/BridgeVideoClient';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';
import { IStreamClosedEvent, IStreamErrorEvent } from '@signageos/front-display/es6/Stream/streamEvents';
import BridgeClient from '../../Bridge/BridgeClient';
import { OpenInternalVideoInput, CloseInternalVideoInput } from '../../Bridge/bridgeVideoMessages';
import { VideoInput } from '../Display/IDisplay';

export default class BridgeStreamPlayer implements IStreamPlayer {

	constructor(
		private window: Window,
		private bridgeClient: BridgeClient,
		private bridgeVideoClient: BridgeVideoClient,
	) {}

	@locked('video')
	public async play(uri: string, x: number, y: number, width: number, height: number, protocol: StreamProtocol): Promise<IStream> {
		if (uri.startsWith('internal://')) {
			await this.playInternal(uri, x, y, width, height);
			return new EventEmitter();
		} else {
			return await this.playStream(uri, x, y, width, height, protocol);
		}
	}

	@locked('video')
	public async stop(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		if (uri.startsWith('internal://')) {
			await this.stopInternal();
		} else {
			await this.stopStream(uri, x, y, width, height);
		}
	}

	@locked('video')
	public async clearAll(): Promise<void> {
		await this.stopInternal();
	}

	private async playInternal(uri: string, x: number, y: number, width: number, height: number) {
		const videoInputName = StreamURI[uri] as VideoInput;
		if (!videoInputName) {
			throw new Error('Invalid internal port ' + uri);
		}
		if (x !== 0 || y !== 0 || width !== this.window.innerWidth || height !== this.window.innerHeight) {
			console.warn(
				'PIP can only run fullscreen at the moment but the provided coordinates are not fullscreen... ' +
				'ignoring the coordinates and running PIP fullscreen',
			);
		}
		await this.bridgeClient.invoke<OpenInternalVideoInput, {}>({
			type: OpenInternalVideoInput,
			input: videoInputName,
		});
	}

	private async stopInternal() {
		await this.bridgeClient.invoke<CloseInternalVideoInput, {}>({
			type: CloseInternalVideoInput,
		});
	}

	private async playStream(uri: string, x: number, y: number, width: number, height: number, protocol: StreamProtocol) {
		if (!this.isStreamingProtocolSupported(protocol)) {
			throw new Error('Streaming protocol is not supported');
		}

		const videoEmitter = await this.bridgeVideoClient.playVideo(uri, x, y, width, height, true);
		return this.convertVideoEventEmitterToStreamEventEmitter(videoEmitter, protocol);
	}

	private async stopStream(uri: string, x: number, y: number, width: number, height: number) {
		try {
			await this.bridgeVideoClient.stopVideo(uri, x, y, width, height);
		} catch (error) {
			console.warn('failed to stop stream', uri);
		}
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

	private convertVideoEventEmitterToStreamEventEmitter(videoEmitter: IVideoEventEmitter, protocol: StreamProtocol): IStream {
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
