import * as moment from 'moment-timezone';
import * as AsyncLock from 'async-lock';
import IFrontDriver, { Hardware } from '@signageos/front-display/es6/NativeDevice/Front/IFrontDriver';
import FrontCapability from '@signageos/front-display/es6/NativeDevice/Front/FrontCapability';
import INetworkInfo from '@signageos/front-display/es6/Front/Device/Network/INetworkInfo';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import Resolution from '@signageos/front-display/es6/NativeDevice/Resolution';
import IKeyUpEvent from '@signageos/front-display/es6/NativeDevice/Input/IKeyUpEvent';
import TimerType from '@signageos/front-display/es6/NativeDevice/Timer/TimerType';
import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';
import TimerLevel from '@signageos/front-display/es6/NativeDevice/Timer/TimerLevel';
import IBrightness from '@signageos/front-display/es6/NativeDevice/IBrightness';
import ProprietaryCache from '@signageos/front-display/es6/Cache/ProprietaryCache';
import ICache from '@signageos/front-display/es6/Cache/ICache';
import ISignature from '@signageos/front-display/es6/NativeDevice/ISignature';
import VideoOrientation from "@signageos/front-display/es6/Video/Orientation";
import ICacheDriver from '@signageos/front-display/es6/NativeDevice/ICacheDriver';
import ICacheStorageInfo from '@signageos/front-display/es6/NativeDevice/ICacheStorageInfo';
import IStreamPlayer from '@signageos/front-display/es6/Stream/IStreamPlayer';
import IFileSystem from '@signageos/front-display/es6/NativeDevice/Front/IFileSystem';
import { APPLICATION_TYPE } from './constants';
import BridgeClient from '../Bridge/BridgeClient';
import BridgeVideoClient from '../Bridge/BridgeVideoClient';
import {
	GetDeviceUid,
	GetModel,
	GetSerialNumber,
	ScreenTurnOff,
	ScreenTurnOn,
	NetworkGetInfo,
	ApplicationRestart,
	SystemReboot,
	SetNativeDebug,
	AudioGetVolume,
	AudioSetVolume,
} from '../Bridge/bridgeSystemMessages';
import {
	IsWifiSupported,
} from '../Bridge/bridgeNetworkMessages';
import BridgeVideoPlayer from './Video/BridgeVideoPlayer';
import BridgeStreamPlayer from './Video/BridgeStreamPlayer';
import PrivateOrientation, { convertScreenOrientationToAngle } from './Orientation';
import FrontFileSystem from './FrontFileSystem';
import OverlayHandler from '../Overlay/OverlayHandler';
import ISocket from '@signageos/front-display/es6/Socket/ISocket';
import cecKeyMap from './Input/cecKeyMap';
import keyboardKeyMap from './Input/keyboardKeyMap';
import Key from '../CEC/Key';
import Led from './Hardware/Led';
import FrontWifi from './Hardware/FrontWifi';

export default class FrontDriver implements IFrontDriver, ICacheDriver {

	private static ORIENTATION_KEY: string = 'local-config-ORIENTATION_KEY';

	public readonly hardware: Hardware;
	public readonly video: BridgeVideoPlayer;
	public readonly stream: IStreamPlayer;
	public readonly fileSystem: IFileSystem;

	private deviceUid: string;
	private lock: AsyncLock;
	private cache: ICache;
	private bridgeVideoClient: BridgeVideoClient;
	private overlay: OverlayHandler;

	private isDisplayOn: boolean = true;

	constructor(
		private window: Window,
		private frontAppletPrefix: string,
		private applicationVersion: string,
		private bridge: BridgeClient,
		private socketClient: ISocket,
		private fileSystemUrl: string,
	) {
		const DEFAULT_TOTAL_SIZE_BYTES = 5 * 1024 * 1024; // Default quota of localStorage in browsers
		this.lock = new AsyncLock();
		this.cache = new ProprietaryCache(this.window.localStorage, DEFAULT_TOTAL_SIZE_BYTES);
		this.bridgeVideoClient = new BridgeVideoClient(this.window, () => this.getScreenOrientation(), this.lock, socketClient);
		this.video = new BridgeVideoPlayer(this.fileSystemUrl, this.bridgeVideoClient);
		this.stream = new BridgeStreamPlayer(this.bridgeVideoClient);
		this.fileSystem = new FrontFileSystem(this.fileSystemUrl, this.bridge, this.socketClient);
		this.overlay = new OverlayHandler(this.window, this.frontAppletPrefix, this.bridge);
		this.hardware = {
			led: new Led(),
			wifi: new FrontWifi(this.bridge),
		};
	}

	public async getConfigurationBaseUrl(): Promise<string | null> {
		return null; // use default
	}

	public getApplicationType() {
		return APPLICATION_TYPE;
	}

	public async frontSupports(capability: FrontCapability): Promise<boolean> {
		switch (capability) {
			case FrontCapability.SYSTEM_REBOOT_REMOTE:
			case FrontCapability.APP_RESTART_REMOTE:
			case FrontCapability.DISPLAY_POWER_REMOTE:
			case FrontCapability.SYSTEM_REBOOT_LOCAL:
			case FrontCapability.APP_RESTART_LOCAL:
			case FrontCapability.DISPLAY_POWER_LOCAL:
			case FrontCapability.FILE_SYSTEM_INTERNAL_STORAGE:
			case FrontCapability.FILE_SYSTEM_EXTERNAL_STORAGE:
				return true;
			case FrontCapability.WIFI:
			case FrontCapability.WIFI_SCAN:
				return await this.isWifiSupported();
			default:
				return false;
		}
	}

	public async getModel(): Promise<string> {
		const response = await this.bridge.invoke<GetModel, { model: string }>({ type: GetModel });
		return response.model;
	}

	public async onLoad(callback: () => void) {
		this.initialize();
		callback();
	}

	public isDetected() {
		return true;
	}

	public async appReboot(): Promise<void> {
		await this.bridge.invoke<SystemReboot, {}>({ type: SystemReboot });
	}

	public async appRestart() {
		await this.bridge.invoke<ApplicationRestart, {}>({ type: ApplicationRestart });
	}

	public async packageInstall(_baseUrl: string, _packageName: string, _version: string, _build: string | null): Promise<void> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async getApplicationVersion(): Promise<string> {
		return this.applicationVersion;
	}

	public start() {
		console.info('Started Linux front driver');
	}

	public stop() {
		console.info('Stopped Linux front driver');
	}

	public async getNetworkInfo(): Promise<INetworkInfo> {
		const { networkInfo } = await this.bridge.invoke<NetworkGetInfo, { networkInfo: INetworkInfo }>({
			type: NetworkGetInfo,
		});
		return networkInfo;
	}

	public async getSerialNumber(): Promise<string> {
		const { serialNumber } = await this.bridge.invoke<GetSerialNumber, { serialNumber: string }>({
			type: GetSerialNumber,
		});
		return serialNumber;
	}

	public async getCurrentTimeWithTimezone(): Promise<{
		currentDate: Date;
		timezone?: string;
	}> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async setCurrentTime(_currentMoment: moment.Moment): Promise<void> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async setCurrentTimeWithTimezone(_currentDate: moment.Moment, _timezone: string): Promise<boolean> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async displayIsPowerOn(): Promise<boolean> {
		return this.isDisplayOn;
	}

	public async displayPowerOn(): Promise<void> {
		await this.bridge.invoke<ScreenTurnOn, {}>({ type: ScreenTurnOn });
		this.isDisplayOn = true;
	}

	public async displayPowerOff(): Promise<void> {
		await this.bridge.invoke<ScreenTurnOff, {}>({ type: ScreenTurnOff });
		this.isDisplayOn = false;
	}

	public bindKeyUp(keyUpListener: (keyUpEvent: IKeyUpEvent) => void) {
		// keyboard
		this.window.addEventListener('keyup', (event: KeyboardEvent) => {
			if (typeof keyboardKeyMap[event.key] !== 'undefined') {
				keyUpListener({ keyCode: keyboardKeyMap[event.key] });
			} else {
				console.warn(new Error('Not supported key ' + event.key));
			}
		});
		// CEC
		this.socketClient.on('keypress', (key: Key) => {
			if (typeof cecKeyMap[key] !== 'undefined') {
				keyUpListener({
					keyCode: cecKeyMap[key],
				});
			} else {
				console.warn(new Error('Not supported keyCode ' + key));
			}
		});
	}

	public cacheGetUids() {
		return this.cache.fetchAllUids();
	}

	public cacheGetAll() {
		return this.cache.fetchAll();
	}

	public cacheGet(uid: string) {
		return this.cache.fetchOne(uid);
	}

	public cacheDelete(uid: string) {
		return this.cache.deleteOne(uid);
	}

	public cacheSave(uid: string, content: string) {
		return this.cache.saveOne(uid, content);
	}

	public cacheGetStorageInfo(): Promise<ICacheStorageInfo> {
		return this.cache.getStorageInfo();
	}

	public async getDeviceUid(): Promise<string> {
		if (!this.deviceUid) {
			const { deviceUid } = await this.bridge.invoke<GetDeviceUid, { deviceUid: string }>({ type: GetDeviceUid });
			this.deviceUid = deviceUid;
		}

		return this.deviceUid;
	}

	public async isConnected(): Promise<boolean> {
		return navigator.onLine;
	}

	public async screenResize(
		_baseUrl: string,
		orientation: Orientation,
		_resolution: Resolution,
		_videoOrientation?: VideoOrientation,
	) {
		await this.setScreenOrientation(orientation);
		return () => this.appRestart();
	}

	public async getSessionId(sessionIdKey: string) {
		return this.window.localStorage.getItem(sessionIdKey);
	}

	public async setSessionId(sessionIdKey: string, sessionId: string) {
		this.window.localStorage.setItem(sessionIdKey, sessionId);
	}

	public async restoreDisplayArea() {
		await this.video.clearAll();
		await this.stream.clearAll();
		await this.bridgeVideoClient.clearAll();
		await this.overlay.clearAll();
	}

	public areTimersSupported(powerTimerLevel: TimerLevel) {
		switch (powerTimerLevel) {
			case TimerLevel.NATIVE: return false;
			case TimerLevel.PROPRIETARY: return true;
			default: return false;
		}
	}

	public async setTimer(_type: TimerType, _timeOn: string | null, _timeOff: string | null, _weekdays: TimerWeekday[], _volume: number) {
		throw new Error('setTimer not implemented');
	}

	public async timerSetOnOffTimeHoliday(_type: TimerType, _onAtHoliday: boolean, _offAtHoliday: boolean) {
		throw new Error('timerSetOnOffTimeHoliday not implemented');
	}

	public async screenSetBrightness(_timeFrom1: string, _brightness1: number, _timeFrom2: string, _brightness2: number): Promise<void> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async screenGetBrightness(): Promise<IBrightness> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public screenSupportsBrightnessSchedule() {
		return false; // TODO : implement
	}

	public async remoteControleSetEnabled(_enabled: boolean): Promise<void> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async remoteControleIsEnabled(): Promise<boolean> {
		throw new Error("Not implemented"); // TODO : implement
	}

	public async controlSetPin(_pin: string): Promise<void> {
		throw new Error('controlSetPin not implemented');
	}

	public async browserOpenLink(_uri: string): Promise<void> {
		throw new Error('browserOpenLink not implemented');
	}

	public async setDebug(isEnabled: boolean): Promise<void> {
		await this.bridge.invoke<SetNativeDebug, {}>({
			type: SetNativeDebug,
			isEnabled,
		});
	}

	public async getCurrentSignature(): Promise<ISignature | null> {
		return null;
	}

	public async getVolume(): Promise<number> {
		const { volume } = await this.bridge.invoke<AudioGetVolume, { volume: number }>({
			type: AudioGetVolume,
		});
		return volume;
	}

	public async setVolume(volume: number): Promise<void> {
		if (volume < 0 || volume > 100) {
			throw new Error('Invalid volume, must be an integer between 0-100');
		}
		await this.bridge.invoke<AudioSetVolume, {}>({
			type: AudioSetVolume,
			volume: Math.trunc(volume),
		});
	}

	public getOSDUri(): string {
		return "osd.html";
	}

	private initialize() {
		this.screenUpdateOrientation();
	}

	private screenUpdateOrientation() {
		const orientation = this.getScreenOrientation();
		const rotation = convertScreenOrientationToAngle(orientation);

		const body = this.window.document.getElementById('body')!;
		body.style.webkitTransform = `rotate(${rotation}deg)`;
		body.style.position = 'absolute';

		switch (orientation) {
			case Orientation.LANDSCAPE:
			case Orientation.LANDSCAPE_FLIPPED:
				body.style.width = '100vw';
				body.style.height = '100vh';
				body.style.left = '0';
				body.style.top = '0';
				break;
			case Orientation.PORTRAIT:
			case Orientation.PORTRAIT_FLIPPED:
				const fixingOffset = (this.window.innerWidth - this.window.innerHeight) / 2;
				body.style.width = '100vh';
				body.style.height = '100vw';
				body.style.left = fixingOffset + 'px';
				body.style.top = '-' + fixingOffset + 'px';
				break;
			default:
		}
	}

	private getScreenOrientation() {
		const orientation = this.window.localStorage.getItem(FrontDriver.ORIENTATION_KEY) as PrivateOrientation;
		if (!orientation) {
			return Orientation.LANDSCAPE;
		}

		switch (orientation) {
			case PrivateOrientation.PORTRAIT:
				return Orientation.PORTRAIT;
			case PrivateOrientation.PORTRAIT_FLIPPED:
				return Orientation.PORTRAIT_FLIPPED;
			case PrivateOrientation.LANDSCAPE_FLIPPED:
				return Orientation.LANDSCAPE_FLIPPED;
			default:
				return Orientation.LANDSCAPE;
		}
	}

	private setScreenOrientation(orientation: Orientation) {
		let privateOrientation: PrivateOrientation;

		switch (orientation) {
			case Orientation.LANDSCAPE:
				privateOrientation = PrivateOrientation.LANDSCAPE;
				break;
			case Orientation.LANDSCAPE_FLIPPED:
				privateOrientation = PrivateOrientation.LANDSCAPE_FLIPPED;
				break;
			case Orientation.PORTRAIT:
				privateOrientation = PrivateOrientation.PORTRAIT;
				break;
			case Orientation.PORTRAIT_FLIPPED:
				privateOrientation = PrivateOrientation.PORTRAIT_FLIPPED;
				break;
			default:
				throw new Error('Invalid orientation');
		}

		this.window.localStorage.setItem(FrontDriver.ORIENTATION_KEY, privateOrientation as string);
	}

	private async isWifiSupported() {
		const { isWifiSupported } = await this.bridge.invoke<IsWifiSupported, { isWifiSupported: boolean }>({
			type: IsWifiSupported,
		});
		return isWifiSupported;
	}
}
