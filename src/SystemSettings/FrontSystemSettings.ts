import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import VideoOrientation from '@signageos/front-display/es6/Video/Orientation';
import ISystemSettings from './ISystemSettings';
import BridgeClient from '../Bridge/BridgeClient';
import * as AudioMessages from '../Bridge/bridgeAudioMessages';
import * as ScreenMessages from '../Bridge/bridgeScreenMessages';

export default class FrontSystemSettings implements ISystemSettings {

	constructor(private bridge: BridgeClient) {}

	public async getVolume(): Promise<number> {
		const { volume } = await this.bridge.invoke<AudioMessages.GetVolume, { volume: number }>({
			type: AudioMessages.GetVolume,
		});
		return volume;
	}

	public async setVolume(volume: number): Promise<void> {
		await this.bridge.invoke<AudioMessages.SetVolume, {}>({
			type: AudioMessages.SetVolume,
			volume,
		});
	}

	public async getScreenOrientation(): Promise<Orientation> {
		const { orientation } = await this.bridge.invoke<ScreenMessages.GetOrientation, { orientation: Orientation }>({
			type: ScreenMessages.GetOrientation,
		});
		return orientation;
	}

	public async getVideoOrientation(): Promise<VideoOrientation | null> {
		const { videoOrientation } = await this.bridge
			.invoke<ScreenMessages.GetVideoOrientation, { videoOrientation: VideoOrientation | null }>({
				type: ScreenMessages.GetVideoOrientation,
			});
		return videoOrientation;
	}

	public async setScreenOrientation(orientation: Orientation, videoOrientation?: VideoOrientation): Promise<void> {
		await this.bridge.invoke<ScreenMessages.SetOrientation, {}>({
			type: ScreenMessages.SetOrientation,
			orientation,
			videoOrientation,
		});
	}
}
