import * as url from 'url';
import * as path from 'path';
import { checksumString } from '@signageos/lib/dist/Hash/checksum';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import ManagementCapability from '@signageos/front-display/es6/NativeDevice/Management/ManagementCapability';
import IManagementFileSystem from '@signageos/front-display/es6/NativeDevice/Management/IFileSystem';
import INetworkInfo from '@signageos/front-display/es6/Front/Device/Network/INetworkInfo';
import IBatteryStatus from '@signageos/front-display/es6/NativeDevice/Battery/IBatteryStatus';
import Capability from '@signageos/front-display/es6/NativeDevice/Management/ManagementCapability';
import { APPLICATION_TYPE } from './constants';
import IBasicDriver from '../../node_modules/@signageos/front-display/es6/NativeDevice/IBasicDriver';
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import * as SystemAPI from '../API/SystemAPI';
import * as NetworkAPI from '../API/NetworkAPI';
import ICache from '../Cache/ICache';
import IFileSystem from '../FileSystem/IFileSystem';
import ManagementFileSystem from './ManagementFileSystem';

export default class ManagementDriver implements IBasicDriver, IManagementDriver {

	public fileSystem: IManagementFileSystem;
	private deviceUid: string;

	constructor(
		private remoteServerUrl: string,
		private cache: ICache,
		private internalFileSystem: IFileSystem,
	) {
		this.fileSystem = new ManagementFileSystem(this.internalFileSystem);
	}

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
		const internalStorageUnit = await this.internalFileSystem.getInternalStorageUnit();
		const APP_SUBDIR = '__apps';
		const destinationDirectory = {
			storageUnit: internalStorageUnit,
			filePath: APP_SUBDIR,
		};
		const destinationFile = {
			storageUnit: internalStorageUnit,
			filePath: APP_SUBDIR + '/' + version + '.deb',
		};
		const sourcePath = `/app/linux/${version}/signageos-display-linux.deb`;
		const sourceUrl = baseUrl + sourcePath;

		console.log('downloading new app ' + version);
		await this.internalFileSystem.ensureDirectory(destinationDirectory);
		await this.internalFileSystem.downloadFile(destinationFile, sourceUrl);
		console.log(`app ${version} downloaded`);

		try {
			const absoluteFilePath = this.internalFileSystem.getAbsolutePath(destinationFile);
			await SystemAPI.upgradeApp(absoluteFilePath);
			console.log('upgraded to version ' + version);
		} finally {
			await this.internalFileSystem.deleteFile(destinationFile);
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
		const SCREENSHOT_DIR = 'screenshots';
		const screenshotFilename = new Date().valueOf() + 'png';
		const tmpStorageUnit = this.internalFileSystem.getTmpStorageUnit();
		const destinationDir = {
			storageUnit: tmpStorageUnit,
			filePath: SCREENSHOT_DIR,
		} as IFilePath;
		const destinationFile = {
			...destinationDir,
			filePath: path.join(destinationDir.filePath, screenshotFilename),
		};
		await this.internalFileSystem.ensureDirectory(destinationDir);
		const destinationAbsolutePath = this.internalFileSystem.getAbsolutePath(destinationFile);
		await SystemAPI.takeScreenshot(destinationAbsolutePath);
		const uploadUri = uploadBaseUrl + '/upload/file?prefix=screenshot/';
		const response = await this.internalFileSystem.uploadFile(destinationFile, 'file', uploadUri);
		const data = JSON.parse(response);

		try {
			await this.internalFileSystem.deleteFile(destinationFile);
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
