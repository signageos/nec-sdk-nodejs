import ISensors, { SensorCapability } from './ISensors';
import IProximitySensor from '@signageos/front-display/es6/NativeDevice/Sensors/IProximitySensor';
import { INECAPI } from '../../API/NECAPI';
import NECProximitySensor from './Proximity/NECProximitySensor';

export default class NECSensors implements ISensors {

	public readonly proximity: IProximitySensor;

	constructor(necAPI: INECAPI) {
		this.proximity = new NECProximitySensor(necAPI);
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
