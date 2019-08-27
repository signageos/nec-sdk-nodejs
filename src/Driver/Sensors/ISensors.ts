import { ISensors as IBaseSensors } from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';

export enum SensorCapability {
	PROXIMITY
}

export default interface ISensors extends IBaseSensors {
	supports(capability: SensorCapability): boolean;
}
