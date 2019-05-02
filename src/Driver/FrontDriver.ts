import * as AsyncLock from 'async-lock';
import IFrontDriver, { Hardware } from '@signageos/front-display/es6/NativeDevice/Front/IFrontDriver';
import FrontCapability from '@signageos/front-display/es6/NativeDevice/Front/FrontCapability';
import INetworkInfo from '@signageos/front-display/es6/Management/Device/Network/INetworkInfo';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import IKeyUpEvent from '@signageos/front-display/es6/NativeDevice/Input/IKeyUpEvent';
import ProprietaryCache from '@signageos/front-display/es6/Cache/ProprietaryCache';
import ICache from '@signageos/front-display/es6/Cache/ICache';
import ISignature from '@signageos/front-display/es6/NativeDevice/ISignature';
import ICacheDriver from '@signageos/front-display/es6/NativeDevice/ICacheDriver';
import ICacheStorageInfo from '@signageos/front-display/es6/NativeDevice/ICacheStorageInfo';
import IStreamPlayer from '@signageos/front-display/es6/Stream/IStreamPlayer';
import IFileSystem from '@signageos/front-display/es6/NativeDevice/IFileSystem';
import { APPLICATION_TYPE } from './constants';
import BridgeClient from '../Bridge/BridgeClient';
import BridgeVideoClient from '../Bridge/BridgeVideoClient';
import {
	GetDeviceUid,
	GetModel,
	GetSerialNumber,
	NetworkGetInfo,
	RemoteControlSetEnabled,
	RemoteControlIsEnabled,
	ControlSetPin,
	BrowserOpenLink,
} from '../Bridge/bridgeSystemMessages';
import {
	IsWifiSupported,
} from '../Bridge/bridgeNetworkMessages';
import * as ScreenMessages from '../Bridge/bridgeScreenMessages';
import BridgeVideoPlayer from './Video/BridgeVideoPlayer';
import BridgeStreamPlayer from './Video/BridgeStreamPlayer';
import PrivateOrientation, { convertScreenOrientationToAngle } from './Orientation';
import FrontFileSystem from './FrontFileSystem';
import OverlayHandler from '../Overlay/OverlayHandler';
import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';
import cecKeyMap from './Input/cecKeyMap';
import keyboardKeyMap from './Input/keyboardKeyMap';
import Key from '../CEC/Key';
import Led from './Hardware/Led';
import FrontWifi from './Hardware/FrontWifi';

export default class FrontDriver implements IFrontDriver, ICacheDriver {

	public readonly hardware: Hardware;
	public readonly video: BridgeVideoPlayer;
	public readonly stream: IStreamPlayer;
	public readonly fileSystem: IFileSystem;

	private deviceUid: string;
	private lock: AsyncLock;
	private cache: ICache;
	private bridgeVideoClient: BridgeVideoClient;
	private overlay: OverlayHandler;

	private orientation: Orientation | null = null;

	constructor(
		private window: Window,
		private frontAppletPrefix: string,
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
		await this.screenUpdateOrientation();
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

	public async browserOpenLink(uri: string): Promise<void> {
		await this.bridge.invoke<BrowserOpenLink, void>({
			type: BrowserOpenLink,
			uri,
		});
	}

	public async getCurrentSignature(): Promise<ISignature | null> {
		return null;
	}

	public getOSDUri(): string {
		return "osd.html";
	}

	private async screenUpdateOrientation() {
		const orientation = await this.getScreenOrientation();
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

	private async getScreenOrientation() {
		if (this.orientation === null) {
			const { orientation } = await this.bridge.invoke<ScreenMessages.GetOrientation, { orientation: PrivateOrientation }>({
				type: ScreenMessages.GetOrientation,
			});
			this.orientation = Orientation[orientation as keyof typeof Orientation];
		}

		return this.orientation;
	}

	private async isWifiSupported() {
		const { isWifiSupported } = await this.bridge.invoke<IsWifiSupported, { isWifiSupported: boolean }>({
			type: IsWifiSupported,
		});
		return isWifiSupported;
	}
}
