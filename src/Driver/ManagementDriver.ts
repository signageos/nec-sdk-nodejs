import IManagementDriver from '@signageos/front-display/es6/NativeDevice/IManagementDriver';
import IBatteryStatus from '@signageos/front-display/es6/NativeDevice/Battery/IBatteryStatus';
import IStorageUnit from '@signageos/front-display/es6/NativeDevice/IStorageUnit';
import Capability from '@signageos/front-display/es6/NativeDevice/Capability';
import { APPLICATION_TYPE } from './constants';
import IBasicDriver from '../../node_modules/@signageos/front-display/es6/NativeDevice/IBasicDriver';

export default class ManagementDriver implements IBasicDriver, IManagementDriver {

	public start() {
		console.info('Started Linux management driver');
	}

	public stop() {
		// do nothing
	}

	public getApplicationType(): string {
		return APPLICATION_TYPE;
	}

	public async getDeviceUid(): Promise<string> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async getModel(): Promise<string> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async batteryGetStatus(): Promise<IBatteryStatus> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async fileSystemGetStorageUnits(): Promise<IStorageUnit[]> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public getCurrentTemperature(): number {
		return 0; // TODO : implement
	}

	public async getEthernetMacAddress(): Promise<string> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async getSerialNumber(): Promise<string> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async getWifiMacAddress(): Promise<string> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async screenshotUpload(_uploadBaseUrl: string): Promise<string> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async isConnected(): Promise<boolean> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public getSessionId(_sessionIdKey: string): string | null {
		return null; // TODO : implement
	}

	public setSessionId(_sessionIdKey: string, _sessionId: string): void {
		// TODO : implement
	}

	public supports(_capability: Capability): boolean {
		return false; // TODO : implement
	}

	public async getConfigurationBaseUrl(): Promise<string | null> {
		return null; // use default
	}
}
