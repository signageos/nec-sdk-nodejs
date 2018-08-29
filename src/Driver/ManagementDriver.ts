import * as url from 'url';
import { checksumString } from '@signageos/lib/dist/Hash/checksum';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/IManagementDriver';
import IBatteryStatus from '@signageos/front-display/es6/NativeDevice/Battery/IBatteryStatus';
import IStorageUnit from '@signageos/front-display/es6/NativeDevice/IStorageUnit';
import Capability from '@signageos/front-display/es6/NativeDevice/Capability';
import { APPLICATION_TYPE } from './constants';
import IBasicDriver from '../../node_modules/@signageos/front-display/es6/NativeDevice/IBasicDriver';
import * as SystemAPI from '../API/SystemAPI';
import * as NetworkAPI from '../API/NetworkAPI';
import ICache from '../Cache/ICache';

export default class ManagementDriver implements IBasicDriver, IManagementDriver {

	private deviceUid: string;

	constructor(
		private remoteServerUrl: string,
		private cache: ICache,
	) {}

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
		if (this.deviceUid) {
			return this.deviceUid;
		}

		const serialNumber = await this.getSerialNumber();
		this.deviceUid = checksumString(serialNumber);
		return this.deviceUid;
	}

	public async getModel(): Promise<string> {
		return await SystemAPI.getModel();
	}

	public async batteryGetStatus(): Promise<IBatteryStatus> {
		throw new Error('batteryGetStatus not implemented');
	}

	public async fileSystemGetStorageUnits(): Promise<IStorageUnit[]> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async getCurrentTemperature(): Promise<number> {
		return await SystemAPI.getCpuTemperature();
	}

	public async getEthernetMacAddress(): Promise<string> {
		const networkInterfaces = await NetworkAPI.getNetworkInterfaces();
		for (let networkInterface of networkInterfaces) {
			if (networkInterface.type === NetworkAPI.NetworkInterfaceType.ETHERNET) {
				return networkInterface.mac;
			}
		}

		throw new Error('Failed to get ethernet mac address: no ethernet interface found');
	}

	public async getSerialNumber(): Promise<string> {
		return await SystemAPI.getSerialNumber();
	}

	public async getWifiMacAddress(): Promise<string> {
		const networkInterfaces = await NetworkAPI.getNetworkInterfaces();
		for (let networkInterface of networkInterfaces) {
			if (networkInterface.type === NetworkAPI.NetworkInterfaceType.WIFI) {
				return networkInterface.mac;
			}
		}

		throw new Error('Failed to get wifi mac address: no wifi interface found');
	}

	public async screenshotUpload(_uploadBaseUrl: string): Promise<string> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async isConnected(): Promise<boolean> {
		const remoteServerHostname = url.parse(this.remoteServerUrl).hostname!;
		return await NetworkAPI.isConnectedToInternet(remoteServerHostname);
	}

	public async getSessionId(sessionIdKey: string): Promise<string | null> {
		return await this.cache.get(sessionIdKey);
	}

	public async setSessionId(sessionIdKey: string, sessionId: string): Promise<void> {
		await this.cache.save(sessionIdKey, sessionId);
	}

	public supports(capability: Capability): boolean {
		switch (capability) {
			case Capability.MODEL:
			case Capability.SERIAL_NUMBER:
			case Capability.WIFI_MAC:
			case Capability.ETHERNET_MAC:
			case Capability.TEMPERATURE:
				return true;

			default:
				return false;
		}
	}

	public async getConfigurationBaseUrl(): Promise<string | null> {
		return null; // use default
	}
}
