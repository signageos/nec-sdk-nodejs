import * as url from 'url';
import * as path from 'path';
import * as moment from 'moment-timezone';
import { checksumString } from '@signageos/lib/dist/Hash/checksum';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import ManagementCapability from '@signageos/front-display/es6/NativeDevice/Management/ManagementCapability';
import Capability from '@signageos/front-display/es6/NativeDevice/Management/ManagementCapability';
import IFileSystem from '@signageos/front-display/es6/NativeDevice/IFileSystem';
import IServletRunner from '@signageos/front-display/es6/Servlet/IServletRunner';
import INetworkInfo from '@signageos/front-display/es6/Management/Device/Network/INetworkInfo';
import IBatteryStatus from '@signageos/front-display/es6/NativeDevice/Battery/IBatteryStatus';
import { APPLICATION_TYPE } from './constants';
import IBasicDriver from '../../node_modules/@signageos/front-display/es6/NativeDevice/IBasicDriver';
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import * as SystemAPI from '../API/SystemAPI';
import * as NetworkAPI from '../API/NetworkAPI';
import IInternalFileSystem from '../FileSystem/IFileSystem';
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
import IFileDetailsProvider from '../FileSystem/IFileDetailsProvider';
import ServletRunner from '../Servlet/ServletRunner';
import IDisplay from './Display/IDisplay';
import DisplayCapability from './Display/DisplayCapability';
import { resolveCurrentBrightness } from '@signageos/front-display/es6/NativeDevice/Screen/screenHelper';
import { now } from '@signageos/lib/dist/DateTime/dateTimeFactory';

export default class ManagementDriver implements IBasicDriver, IManagementDriver, ICacheDriver {

	public fileSystem: IFileSystem;
	public servletRunner: IServletRunner;
	private deviceUid: string;

	constructor(
		private remoteServerUrl: string,
		fileSystemUrl: string,
		private cache: ICache,
		private internalFileSystem: IInternalFileSystem,
		private systemSettings: ISystemSettings,
		private videoPlayer: IServerVideoPlayer,
		private overlayRenderer: OverlayRenderer,
		fileDetailsProvider: IFileDetailsProvider,
		private display: IDisplay,
	) {
		this.fileSystem = new ManagementFileSystem(fileSystemUrl, internalFileSystem, fileDetailsProvider);
		this.servletRunner = new ServletRunner(internalFileSystem);
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

	public async appUpgrade(_baseUrl: string, version: string) {
		await SystemAPI.upgradeApp(version);
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

		try {
			const response = await this.internalFileSystem.uploadFile(destinationFile, 'file', uploadUri);
			const data = JSON.parse(response);
			return data.uri;
		} finally {
			try {
				await this.internalFileSystem.deleteFile(destinationFile);
			} catch (error) {
				console.error('failed to cleanup screenshot after upload');
			}
		}
	}

	public async isConnected(): Promise<boolean> {
		const remoteServerHostname = url.parse(this.remoteServerUrl).hostname!;
		return await NetworkAPI.isConnectedToInternet(remoteServerHostname);
	}

	public async getSessionId(sessionIdKey: string): Promise<string | null> {
		try {
			return await this.cache.fetchOne(sessionIdKey);
		} catch (error) {
			return null;
		}
	}

	public async setSessionId(sessionIdKey: string, sessionId: string): Promise<void> {
		await this.cache.saveOne(sessionIdKey, sessionId);
	}

	public async managementSupports(capability: ManagementCapability) {
		switch (capability) {
			case Capability.MODEL:
			case Capability.SERIAL_NUMBER:
			case Capability.NETWORK_INFO:
			case Capability.STORAGE_UNITS:
			case Capability.TEMPERATURE:
			case Capability.SCREENSHOT_UPLOAD:
			case Capability.TIMERS_PROPRIETARY:
			case Capability.SCREEN_RESIZE:
			case Capability.APP_UPGRADE:
			case Capability.FIRMWARE_UPGRADE:
			case Capability.SET_VOLUME:
			case Capability.SET_DEBUG:
			case Capability.SYSTEM_REBOOT:
			case Capability.APP_RESTART:
			case Capability.DISPLAY_POWER:
			case Capability.SERVLET:
				return true;

			case Capability.SET_BRIGHTNESS:
				return this.display.supports(DisplayCapability.BRIGHTNESS);

			case Capability.TIMERS_NATIVE:
				return this.display.supports(DisplayCapability.SCHEDULE);

			default:
				return false;
		}
	}

	public async getConfigurationBaseUrl(): Promise<string | null> {
		return null; // use default
	}

	public async getVolume(): Promise<number> {
		return await this.display.getVolume();
	}

	public async setVolume(volume: number): Promise<void> {
		await this.display.setVolume(volume);
	}

	public async screenGetBrightness(): Promise<IBrightness> {
		const brightness = await this.display.getBrightness();
		return {
			brightness1: brightness,
			brightness2: brightness,
			timeFrom1: '00:00:00',
			timeFrom2: '00:00:00',
		};
	}

	public async screenSetBrightness(timeFrom1: string, brightness1: number, timeFrom2: string, brightness2: number): Promise<void> {
		let brightness = brightness1 === brightness2 ?
			brightness1 :
			resolveCurrentBrightness(timeFrom1, brightness1, timeFrom2, brightness2, now().toDate());
		await this.display.setBrightness(brightness);
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
		return await this.display.isPowerOn();
	}

	public async displayPowerOn(): Promise<void> {
		await this.display.powerOn();
	}

	public async displayPowerOff(): Promise<void> {
		await this.display.powerOff();
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

	public getTimers() {
		return this.display.getTimers();
	}

	public setTimer(
		type: TimerType,
		timeOn: string | null,
		timeOff: string | null,
		weekdays: TimerWeekday[],
		_volume: number,
	): Promise<void> {
		return this.display.setTimer(type, timeOn, timeOff, weekdays);
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

	public async setCurrentTimeWithTimezone(_currentDate: moment.Moment, _timezone: string): Promise<void> {
		throw new Error('Not implemented');
	}

	public async setDebug(enabled: boolean): Promise<void> {
		if (enabled) {
			await SystemAPI.enableNativeDebug();
		} else {
			await SystemAPI.disableNativeDebug();
		}
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
