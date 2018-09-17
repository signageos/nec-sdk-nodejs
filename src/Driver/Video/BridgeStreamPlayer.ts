import * as AsyncLock from 'async-lock';
import IStreamPlayer from '@signageos/front-display/es6/Stream/IStreamPlayer';
import StreamProtocol from '@signageos/front-display/es6/Stream/StreamProtocol';
import IStream from '@signageos/front-display/es6/Stream/IStream';
import BridgeClient from '../../Bridge/BridgeClient';

export default class BridgeStreamPlayer implements IStreamPlayer {

	constructor(
		private lock: AsyncLock,
		private bridge: BridgeClient,
	) {}

	public async play(uri: string, x: number, y: number, width: number, height: number, protocol: StreamProtocol): Promise<IStream> {
		if (uri.startsWith('internal://')) {
			throw new Error('Playing from internal port is not supported');
		}

		if (!this.isStreamingProtocolSupported(protocol)) {
			throw new Error('Streaming protocol is not supported');
		}

		return await this.lock.acquire('video', async () => {
			return await this.bridge.video.playVideo(uri, x, y, width, height, true);
		});
	}

	public async stop(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		await this.lock.acquire('video', async () => {
			await this.bridge.video.stopVideo(uri, x, y, width, height, true);
		});
	}

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
}
