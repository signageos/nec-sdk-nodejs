import ILed from '@signageos/front-display/es6/NativeDevice/Hardware/ILed';

export default class Led implements ILed {

	public async setColor(_color: string) {
		console.warn(new Error('Not implemented hardware led set color'));
	}
}
