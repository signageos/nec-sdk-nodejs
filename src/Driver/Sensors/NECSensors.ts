import NECPD from '@signageos/nec-sdk/dist/NECPD';
import ISensors, { SensorCapability } from './ISensors';
import IProximitySensor from '@signageos/front-display/es6/NativeDevice/Sensors/IProximitySensor';
import NECProximitySensor from './Proximity/NECProximitySensor';

export default class NECSensors implements ISensors {

	public readonly proximity: IProximitySensor;

	constructor(necPD: NECPD) {
		this.proximity = new NECProximitySensor(necPD);
	}

	public supports(capability: SensorCapability): boolean {
		switch (capability) {
			case SensorCapability.PROXIMITY:
				return true;
			default:
				return false;
		}
	}
}
