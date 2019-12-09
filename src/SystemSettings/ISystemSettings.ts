import Orientation from '../Driver/Orientation';

export default interface ISystemSettings {
	getVolume(): Promise<number>;
	setVolume(volume: number): Promise<void>;
	getScreenOrientation(): Promise<Orientation>;
	setScreenOrientation(orientation: Orientation): Promise<void>;
	wasFactorySettingsPerformed(): Promise<boolean>;
	setFactorySettingsPerformed(): Promise<void>;
}
