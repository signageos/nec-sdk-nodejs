import * as url from 'url';
import { checksumString } from '@signageos/lib/dist/Hash/checksum';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import ManagementCapability from '@signageos/front-display/es6/NativeDevice/Management/ManagementCapability';
import INetworkInfo from '@signageos/front-display/es6/Front/Device/Network/INetworkInfo';
import IBatteryStatus from '@signageos/front-display/es6/NativeDevice/Battery/IBatteryStatus';
import IStorageUnit from '@signageos/front-display/es6/NativeDevice/IStorageUnit';
import Capability from '@signageos/front-display/es6/NativeDevice/Management/ManagementCapability';
import { APPLICATION_TYPE } from './constants';
import IBasicDriver from '../../node_modules/@signageos/front-display/es6/NativeDevice/IBasicDriver';
import * as SystemAPI from '../API/SystemAPI';
import * as NetworkAPI from '../API/NetworkAPI';
import ICache from '../Cache/ICache';
import IFileSystem from '../FileSystem/IFileSystem';

export default class ManagementDriver implements IBasicDriver, IManagementDriver {

	private deviceUid: string;

	constructor(
		private remoteServerUrl: string,
		private cache: ICache,
		private fileSystem: IFileSystem,
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

	public async appUpgrade(baseUrl: string, version: string) {
		const APP_SUBDIR = '__apps';
		const destinationFile = APP_SUBDIR + '/' + version + '.deb';
		const sourcePath = `/app/linux/${version}/signageos-display-linux.deb`;
		const sourceUrl = baseUrl + sourcePath;

		console.log('downloading new app ' + version);
		await this.fileSystem.downloadFile(destinationFile, sourceUrl);
		console.log(`app ${version} downloaded`);

		try {
			const fullFilePath = this.fileSystem.getFullPath(destinationFile);
			await SystemAPI.upgradeApp(fullFilePath);
			console.log('upgraded to version ' + version);
		} finally {
			await this.fileSystem.deleteFile(destinationFile);
		}

		return () => SystemAPI.reboot();
	}

	public async firmwareGetVersion(): Promise<string> {
		return await SystemAPI.getFirmwareVersion();
	}

	public async firmwareUpgrade(baseUrl: string, version: string, onProgress: (progress: number) => void) {
		onProgress(0);
		const fullUrl = baseUrl + '/linux/firmware/armhf/upgrade/upgrade_' + version + '.tar.gz';
		await SystemAPI.upgradeFirmware(fullUrl);
		onProgress(100);
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

	public async getNetworkInfo(): Promise<INetworkInfo> {
		const ethernet = await NetworkAPI.getEthernet();
		const wifi = await NetworkAPI.getWifi();
		const gateway = await NetworkAPI.getDefaultGateway();
		const dns = await NetworkAPI.getDNSSettings();

		let localAddress: string | undefined = undefined;
		let activeInterface: string | undefined = undefined;
		let netmask: string | undefined = undefined;

		if (ethernet) {
			localAddress = ethernet.ip;
			activeInterface = 'ethernet';
			netmask = ethernet.netmask;
		} else if (wifi) {
			localAddress = wifi.ip;
			activeInterface = 'wifi';
			netmask = wifi.netmask;
		}

		return {
			localAddress,
			ethernetMacAddress: ethernet ? ethernet.mac : undefined,
			wifiMacAddress: wifi ? wifi.mac : undefined,
			activeInterface,
			gateway: gateway || undefined,
			netmask,
			dns,
		} as INetworkInfo;
	}

	public async getSerialNumber(): Promise<string> {
		return await SystemAPI.getSerialNumber();
	}

	public async screenshotUpload(uploadBaseUrl: string): Promise<string> {
		const screenshotPath = await SystemAPI.takeScreenshot();
		const uploadUri = uploadBaseUrl + '/upload/file?prefix=screenshot/';
		const response = await this.fileSystem.uploadFile(screenshotPath, 'file', uploadUri);
		const data = JSON.parse(response);

		try {
			await this.fileSystem.deleteFile(screenshotPath);
		} catch (error) {
			console.error('failed to cleanup screenshot after upload');
		}

		return data.uri;
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

	public managementSupports(capability: ManagementCapability): boolean {
		switch (capability) {
			case Capability.MODEL:
			case Capability.SERIAL_NUMBER:
			case Capability.NETWORK_INFO:
			case Capability.TEMPERATURE:
			case Capability.SCREENSHOT_UPLOAD:
				return true;

			default:
				return false;
		}
	}

	public async getConfigurationBaseUrl(): Promise<string | null> {
		return null; // use default
	}
}
