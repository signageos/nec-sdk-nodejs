import IFrontDriver, { Hardware } from '@signageos/front-display/es6/NativeDevice/Front/IFrontDriver';
import FrontCapability from '@signageos/front-display/es6/NativeDevice/Front/FrontCapability';
import IKeyUpEvent from '@signageos/front-display/es6/NativeDevice/Input/IKeyUpEvent';
import ProprietaryCache from '@signageos/front-display/es6/Cache/ProprietaryCache';
import ICache from '@signageos/front-display/es6/Cache/ICache';
import ISignature from '@signageos/front-display/es6/NativeDevice/ISignature';
import ICacheDriver from '@signageos/front-display/es6/NativeDevice/ICacheDriver';
import ICacheStorageInfo from '@signageos/front-display/es6/NativeDevice/ICacheStorageInfo';
import IStreamPlayer from '@signageos/front-display/es6/Stream/IStreamPlayer';
import IFileSystem from '@signageos/front-display/es6/NativeDevice/IFileSystem';
import IBrowser from '@signageos/front-display/es6/NativeDevice/IBrowser';
import { APPLICATION_TYPE } from './constants';
import BridgeClient from '../Bridge/BridgeClient';
import BridgeVideoClient from '../Bridge/BridgeVideoClient';
import {
	GetDeviceUid,
	GetModel,
	GetSerialNumber,
	RemoteControlSetEnabled,
	RemoteControlIsEnabled,
	ControlSetPin,
} from '../Bridge/bridgeSystemMessages';
import {
	IsWifiSupported,
} from '../Bridge/bridgeNetworkMessages';
import BridgeVideoPlayer from './Video/BridgeVideoPlayer';
import BridgeStreamPlayer from './Video/BridgeStreamPlayer';
import FrontFileSystem from './FrontFileSystem';
import OverlayHandler from '../Overlay/OverlayHandler';
import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';
import cecKeyMap from './Input/cecKeyMap';
import keyboardKeyMap from './Input/keyboardKeyMap';
import Key from '../CEC/Key';
import Led from './Hardware/Led';
import FrontWifi from './Hardware/FrontWifi';
import Browser from './Browser';
import { FrontScreenRotationManager } from './Screen/screenRotation';

export default class FrontDriver implements IFrontDriver, ICacheDriver {

	public readonly hardware: Hardware;
	public readonly video: BridgeVideoPlayer;
	public readonly stream: IStreamPlayer;
	public readonly fileSystem: IFileSystem;
	public readonly browser: IBrowser;

	private deviceUid: string;
	private cache: ICache;
	private screenRotationManager: FrontScreenRotationManager;
	private bridgeVideoClient: BridgeVideoClient;
	private overlay: OverlayHandler;

	constructor(
		private window: Window,
		private frontAppletPrefix: string,
		private bridge: BridgeClient,
		private socketClient: ISocket,
		private fileSystemUrl: string,
		maxVideoCount: number,
	) {
		const DEFAULT_TOTAL_SIZE_BYTES = 5 * 1024 * 1024; // Default quota of localStorage in browsers
		this.cache = new ProprietaryCache(this.window.localStorage, DEFAULT_TOTAL_SIZE_BYTES);
		const bodyElement = this.window.document.getElementById('body')!;
		this.screenRotationManager = new FrontScreenRotationManager(
			this.window.localStorage,
			[bodyElement],
			this.bridge,
		);
		this.bridgeVideoClient = new BridgeVideoClient(
			this.window,
			() => this.screenRotationManager.getCurrentOrientation(),
			this.bridge, socketClient,
		);
		this.video = new BridgeVideoPlayer(this.fileSystemUrl, this.bridgeVideoClient, maxVideoCount);
		this.stream = new BridgeStreamPlayer(this.window, this.bridge, this.bridgeVideoClient);
		this.fileSystem = new FrontFileSystem(this.fileSystemUrl, this.bridge, this.socketClient);
		this.browser = new Browser(this.window, this.bridge);
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
			case FrontCapability.FILE_SYSTEM_INTERNAL_STORAGE:
			case FrontCapability.FILE_SYSTEM_EXTERNAL_STORAGE:
			case FrontCapability.TIMERS_PROPRIETARY:
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

	public async initialize(_staticBaseUrl: string) {
		await this.screenRotationManager.updateOrientation();
	}

	public isDetected() {
		return true;
	}

	public start() {
		console.info('Started Linux front driver');
	}

	public stop() {
		console.info('Stopped Linux front driver');
	}

	public async getSerialNumber(): Promise<string> {
		const { serialNumber } = await this.bridge.invoke<GetSerialNumber, { serialNumber: string }>({
			type: GetSerialNumber,
		});
		return serialNumber;
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

	public async getSessionId(sessionIdKey: string) {
		return this.window.localStorage.getItem(sessionIdKey);
	}

	public async setSessionId(sessionIdKey: string, sessionId: string) {
		this.window.localStorage.setItem(sessionIdKey, sessionId);
	}

	public async restoreDisplayArea() {
		await Promise.all([
			this.bridgeVideoClient.clearAll(),
			this.overlay.clearAll(),
			this.browser.close(),
		]);
	}

	public async remoteControlSetEnabled(enabled: boolean): Promise<void> {
		await this.bridge.invoke<RemoteControlSetEnabled, void>({
			type: RemoteControlSetEnabled,
			enabled,
		});
	}

	public async remoteControlIsEnabled(): Promise<boolean> {
		const { enabled } = await this.bridge.invoke<RemoteControlIsEnabled, { enabled: boolean }>({
			type: RemoteControlIsEnabled,
		});
		return enabled;
	}

	public async controlSetPin(pin: string): Promise<void> {
		await this.bridge.invoke<ControlSetPin, void>({
			type: ControlSetPin,
			pin,
		});
	}

	public async browserOpenLink(_uri: string): Promise<void> {
		throw new Error('not implemented');
	}

	public async getCurrentSignature(): Promise<ISignature | null> {
		return null;
	}

	public getOSDUri(): string {
		return "osd.html";
	}

	private async isWifiSupported() {
		const { isWifiSupported } = await this.bridge.invoke<IsWifiSupported, { isWifiSupported: boolean }>({
			type: IsWifiSupported,
		});
		return isWifiSupported;
	}
}
