import ISensors, { SensorCapability } from './ISensors';
import IProximitySensor from '@signageos/front-display/es6/NativeDevice/Sensors/IProximitySensor';
import NotImplementedProximitySensor from '@signageos/front-display/es6/Sensors/NotImplementedProximitySensor';

export default class NotImplementedSensors implements ISensors {

	public readonly proximity: IProximitySensor;

	constructor() {
		this.proximity = new NotImplementedProximitySensor();
	}

	public supports(_capability: SensorCapability): boolean {
		return false;
	}
}
