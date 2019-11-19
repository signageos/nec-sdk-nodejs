import INetworkInfo from '@signageos/front-display/es6/Management/Device/Network/INetworkInfo';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import IFileSystem from '@signageos/front-display/es6/NativeDevice/IFileSystem';
import { APPLICATION_TYPE } from './constants';
import BridgeClient from '../Bridge/BridgeClient';
import {
	GetModel,
	GetSerialNumber,
	NetworkGetInfo,
	Supports,
	AppUpgrade,
	GetTemperature,
	GetBatteryStatus,
	InstallPackage,
	GetCurrentTimeWithTimezone,
	SetManualTimeWithTimezone,
	SetNTPTimeWithTimezone,
	SetDebug,
	RemoteControlSetEnabled,
	RemoteControlIsEnabled,
	ResetSettings,
} from '../Bridge/bridgeSystemMessages';
import * as ScreenMessages from '../Bridge/bridgeScreenMessages';
import * as PowerMessages from '../Bridge/bridgePowerMessages';
import * as AudioMessages from '../Bridge/bridgeAudioMessages';
import * as FirmwareMessages from '../Bridge/bridgeFirmwareMessages';
import FrontFileSystem from './FrontFileSystem';
import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';
import IBrightness from '@signageos/front-display/es6/NativeDevice/IBrightness';
import Resolution from '@signageos/front-display/es6/NativeDevice/Resolution';
import IManagementDriver, { ISensors } from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import IBatteryStatus from '@signageos/front-display/es6/NativeDevice/Battery/IBatteryStatus';
import ManagementCapability from '@signageos/front-display/es6/NativeDevice/Management/ManagementCapability';
import IServletRunner from '@signageos/front-display/es6/Servlet/IServletRunner';
import ITimer from '@signageos/front-display/es6/NativeDevice/Timer/ITimer';
import TimerType from '@signageos/front-display/es6/NativeDevice/Timer/TimerType';
import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';
import { createFrontSensors } from './FrontSensors';

export default class FrontManagementDriver implements IManagementDriver {

	public servletRunner: IServletRunner;
	public readonly fileSystem: IFileSystem;
	public readonly sensors: ISensors;

	constructor(
		private bridge: BridgeClient,
		private socketClient: ISocket,
		private fileSystemUrl: string,
	) {
		this.fileSystem = new FrontFileSystem(this.fileSystemUrl, this.bridge, this.socketClient);
		this.sensors = createFrontSensors(this.socketClient);
	}

	public async initialize(_staticBaseUrl: string) {
		// nothing to initialize
	}

	public getApplicationType() {
		return APPLICATION_TYPE;
	}

	public async managementSupports(capability: ManagementCapability) {
		const { supports } = await this.bridge.invoke<Supports, { supports: boolean }>({
			type: Supports,
			capability,
		});
		return supports;
	}

	public async getModel(): Promise<string> {
		const response = await this.bridge.invoke<GetModel, { model: string }>({ type: GetModel });
		return response.model;
	}

	public async getVolume(): Promise<number> {
		const { volume } = await this.bridge.invoke<AudioMessages.GetVolume, { volume: number }>({
			type: AudioMessages.GetVolume,
		});
		return volume;
	}

	public async setVolume(volume: number): Promise<void> {
		await this.bridge.invoke<AudioMessages.SetVolume, void>({
			type: AudioMessages.SetVolume,
			volume,
		});
	}

	public async screenGetBrightness(): Promise<IBrightness> {
		const { brightness } = await this.bridge.invoke<ScreenMessages.GetBrightness, { brightness: IBrightness }>({
			type: ScreenMessages.GetBrightness,
		});
		return brightness;
	}

	public async screenSetBrightness(timeFrom1: string, brightness1: number, timeFrom2: string, brightness2: number): Promise<void> {
		await this.bridge.invoke<ScreenMessages.SetBrightness, void>({
			type: ScreenMessages.SetBrightness,
			brightness: {
				brightness1,
				timeFrom1,
				brightness2,
				timeFrom2,
			},
		});
	}

	public async displayPowerOn(): Promise<void> {
		await this.bridge.invoke<ScreenMessages.PowerOn, void>({
			type: ScreenMessages.PowerOn,
		});
	}

	public async displayPowerOff(): Promise<void> {
		await this.bridge.invoke<ScreenMessages.PowerOff, void>({
			type: ScreenMessages.PowerOff,
		});
	}

	public async systemReboot(): Promise<void> {
		await this.bridge.invoke<PowerMessages.SystemReboot, void>({
			type: PowerMessages.SystemReboot,
		});
	}

	public async appRestart() {
		await this.bridge.invoke<PowerMessages.AppRestart, void>({
			type: PowerMessages.AppRestart,
		});
	}

	public async appUpgrade(baseUrl: string, version: string): Promise<() => Promise<void>> {
		await this.bridge.invoke<AppUpgrade, void>({
			type: AppUpgrade,
			baseUrl,
			version,
		});
		return () => this.systemReboot();
	}

	public async getCurrentTemperature(): Promise<number> {
		const { temperature } = await this.bridge.invoke<GetTemperature, { temperature: number }>({
			type: GetTemperature,
		});
		return temperature;
	}

	public async screenshotUpload(uploadBaseUrl: string): Promise<string> {
		const { uploadedUri } = await this.bridge.invoke<ScreenMessages.ScreenshotUpload, { uploadedUri: string }>({
			type: ScreenMessages.ScreenshotUpload,
			uploadBaseUrl,
		});
		return uploadedUri;
	}

	public async firmwareUpgrade(
		baseUrl: string,
		version: string,
		_onProgress: (progress: number) => void,
	): Promise<() => Promise<void>> {
		await this.bridge.invoke<FirmwareMessages.Upgrade, void>({
			type: FirmwareMessages.Upgrade,
			baseUrl,
			version,
		});
		return () => this.systemReboot();
	}

	public async firmwareGetVersion(): Promise<string> {
		const { version } = await this.bridge.invoke<FirmwareMessages.GetVersion, { version: string }>({
			type: FirmwareMessages.GetVersion,
		});
		return version;
	}

	public async batteryGetStatus(): Promise<IBatteryStatus> {
		const { batterStatus } = await this.bridge.invoke<GetBatteryStatus, { batterStatus: IBatteryStatus }>({
			type: GetBatteryStatus,
		});
		return batterStatus;
	}

	public async packageInstall(baseUrl: string, packageName: string, version: string, build: string | null): Promise<void> {
		await this.bridge.invoke<InstallPackage, void>({
			type: InstallPackage,
			baseUrl,
			packageName,
			version,
			build,
		});
	}

	public async displayIsPowerOn(): Promise<boolean> {
		const { isPoweredOn } = await this.bridge.invoke<ScreenMessages.IsPoweredOn, { isPoweredOn: boolean }>({
			type: ScreenMessages.IsPoweredOn,
		});
		return isPoweredOn;
	}

	public async getTimers(): Promise<ITimer[]> {
		const { timers } = await this.bridge.invoke<PowerMessages.GetTimers, { timers: ITimer[] }>({
			type: PowerMessages.GetTimers,
		});
		return timers;
	}

	public async setTimer(
		type: TimerType,
		timeOn: string | null,
		timeOff: string | null,
		weekdays: TimerWeekday[],
		volume: number,
	): Promise<void> {
		await this.bridge.invoke<PowerMessages.SetTimer, void>({
			type: PowerMessages.SetTimer,
			timerType: type,
			timeOn,
			timeOff,
			weekdays,
			volume,
		});
	}

	public async getCurrentTimeWithTimezone(): Promise<{ currentDate: Date; timezone?: string; ntpServer?: string }> {
		const result = await this.bridge.invoke<GetCurrentTimeWithTimezone, {
			currentTimestampMs: number;
			timezone?: string;
			ntpServer?: string
		}>({
			type: GetCurrentTimeWithTimezone,
		});
		return {
			currentDate: new Date(result.currentTimestampMs),
			timezone: result.timezone,
			ntpServer: result.ntpServer,
		};
	}

	public async setManualTime(_datetime: Date): Promise<void> {
		throw new Error('not implemented');
	}

	public async setManualTimeWithTimezone(timestampMs: number, timezone: string): Promise<void> {
		await this.bridge.invoke<SetManualTimeWithTimezone, {}>({
			type: SetManualTimeWithTimezone,
			timestampMs,
			timezone,
		});
	}

	public async setNTPTimeWithTimezone(ntpServer: string, timezone: string): Promise<void> {
		await this.bridge.invoke<SetNTPTimeWithTimezone, {}>({
			type: SetNTPTimeWithTimezone,
			ntpServer,
			timezone,
		});
	}

	public async setDebug(enabled: boolean): Promise<void> {
		await this.bridge.invoke<SetDebug, void>({
			type: SetDebug,
			enabled,
		});
	}

	public async screenResize(
		_baseUrl: string,
		orientation: Orientation,
		_resolution: Resolution,
		_currentVersion: string,
		_videoOrientation?: Orientation,
	): Promise<() => Promise<void> | Promise<void>> {
		await this.bridge.invoke<ScreenMessages.SetOrientation, void>({
			type: ScreenMessages.SetOrientation,
			orientation,
		});
		return () => this.systemReboot();
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

	public async resetSettings(): Promise<void> {
		await this.bridge.invoke<ResetSettings, {}>({ type: ResetSettings });
	}
}
