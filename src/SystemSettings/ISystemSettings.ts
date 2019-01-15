export default interface ISystemSettings {
	getVolume(): Promise<number>;
	setVolume(volume: number): Promise<void>;
}
