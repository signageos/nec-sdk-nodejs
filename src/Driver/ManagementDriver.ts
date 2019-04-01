import * as url from 'url';
import * as path from 'path';
import * as moment from 'moment-timezone';
import { checksumString } from '@signageos/lib/dist/Hash/checksum';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import ManagementCapability from '@signageos/front-display/es6/NativeDevice/Management/ManagementCapability';
import IManagementFileSystem from '@signageos/front-display/es6/NativeDevice/Management/IFileSystem';
import INetworkInfo from '@signageos/front-display/es6/Management/Device/Network/INetworkInfo';
import IBatteryStatus from '@signageos/front-display/es6/NativeDevice/Battery/IBatteryStatus';
import Capability from '@signageos/front-display/es6/NativeDevice/Management/ManagementCapability';
import { APPLICATION_TYPE } from './constants';
import IBasicDriver from '../../node_modules/@signageos/front-display/es6/NativeDevice/IBasicDriver';
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import * as SystemAPI from '../API/SystemAPI';
import * as NetworkAPI from '../API/NetworkAPI';
import IFileSystem from '../FileSystem/IFileSystem';
import ISystemSettings from '../SystemSettings/ISystemSettings';
import ManagementFileSystem from './ManagementFileSystem';
import IBrightness from '@signageos/front-display/es6/NativeDevice/IBrightness';
import IServerVideoPlayer from './Video/IServerVideoPlayer';
import OverlayRenderer from '../Overlay/OverlayRenderer';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import Resolution from '@signageos/front-display/es6/NativeDevice/Resolution';
import PrivateOrientation from './Orientation';
import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';
import TimerType from '@signageos/front-display/es6/NativeDevice/Timer/TimerType';
import ICacheDriver from '@signageos/front-display/es6/NativeDevice/ICacheDriver';
import ICache from '@signageos/front-display/es6/Cache/ICache';
import ICacheStorageInfo from '@signageos/front-display/es6/Cache/ICacheStorageInfo';

export default class ManagementDriver implements IBasicDriver, IManagementDriver, ICacheDriver {

	public fileSystem: IManagementFileSystem;
	private deviceUid: string;
	private isDisplayOn: boolean = true;

	constructor(
		private remoteServerUrl: string,
		private cache: ICache,
		private internalFileSystem: IFileSystem,
		private systemSettings: ISystemSettings,
		private videoPlayer: IServerVideoPlayer,
		private overlayRenderer: OverlayRenderer,
	) {
		this.fileSystem = new ManagementFileSystem(this.internalFileSystem);
	}

	public async initialize(_staticBaseUrl: string): Promise<void> {
		// do nothing
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
		return await this.cache.fetchOne(sessionIdKey);
	}

	public async setSessionId(sessionIdKey: string, sessionId: string): Promise<void> {
		await this.cache.saveOne(sessionIdKey, sessionId);
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

	public async getVolume(): Promise<number> {
		return await this.systemSettings.getVolume();
	}

	public async setVolume(volume: number): Promise<void> {
		if (volume < 0 || volume > 100) {
			throw new Error('Invalid volume, must be an integer between 0-100');
		}
		const volumeInt = Math.trunc(volume);
		await this.systemSettings.setVolume(volumeInt);
	}

	public async screenGetBrightness(): Promise<IBrightness> {
		throw new Error('Not implemented');
	}

	public async screenSetBrightness(_timeFrom1: string, _brightness1: number, _timeFrom2: string, _brightness2: number): Promise<void> {
		throw new Error('Not implemented');
	}

	public async packageInstall(_baseUrl: string, _packageName: string, _version: string, _build: string | null): Promise<void> {
		throw new Error('Not implemented');
	}

	public async systemReboot(): Promise<void> {
		await SystemAPI.reboot();
	}

	public async appRestart() {
		await Promise.all([
			SystemAPI.restartApplication(),
			this.videoPlayer.clearAll(),
			this.overlayRenderer.hideAll(),
		]);
	}

	public async displayIsPowerOn(): Promise<boolean> {
		return this.isDisplayOn;
	}

	public async displayPowerOn(): Promise<void> {
		await SystemAPI.turnScreenOn();
		this.isDisplayOn = true;
	}

	public async displayPowerOff(): Promise<void> {
		await SystemAPI.turnScreenOff();
		this.isDisplayOn = false;
	}

	public async screenResize(
		_baseUrl: string,
		orientation: Orientation,
		_resolution: Resolution,
		_currentVersion: string,
		_videoOrientation?: Orientation,
	): Promise<() => Promise<void> | Promise<void>> {
		const privateOrientation = Orientation[orientation] as PrivateOrientation;
		await this.systemSettings.setScreenOrientation(privateOrientation);
		return () => this.appRestart();
	}

	public async setTimer(
		_type: TimerType,
		_timeOn: string | null,
		_timeOff: string | null,
		_weekdays: TimerWeekday[],
		_volume: number,
	): Promise<void> {
		throw new Error('Not implemented');
	}

	public async remoteControlIsEnabled(): Promise<boolean> {
		throw new Error('Not implemented');
	}

	public async remoteControlSetEnabled(_enabled: boolean): Promise<void> {
		throw new Error('Not implemented');
	}

	public async getCurrentTimeWithTimezone(): Promise<{ currentDate: Date; timezone?: string }> {
		throw new Error('Not implemented');
	}

	public async setCurrentTime(_currentDate: moment.Moment): Promise<void> {
		throw new Error('Not implemented');
	}

	public async setCurrentTimeWithTimezone(_currentDate: moment.Moment, _timezone: string): Promise<boolean> {
		throw new Error('Not implemented');
	}

	public cacheGetAll(): Promise<{ [p: string]: string }> {
		return this.cache.fetchAll();
	}

	public cacheGetUids(): Promise<string[]> {
		return this.cache.fetchAllUids();
	}

	public cacheGet(uid: string): Promise<string> {
		return this.cache.fetchOne(uid);
	}

	public cacheSave(uid: string, content: string): Promise<void> {
		return this.cache.saveOne(uid, content);
	}

	public cacheDelete(uid: string): Promise<void> {
		return this.cache.deleteOne(uid);
	}

	public cacheGetStorageInfo(): Promise<ICacheStorageInfo> {
		return this.cache.getStorageInfo();
	}
}
