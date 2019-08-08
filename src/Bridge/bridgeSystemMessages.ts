import ManagementCapability from "@signageos/front-display/es6/NativeDevice/Management/ManagementCapability";

export const NotifyApplicationAlive = 'Application.NotifyAlive';
export interface NotifyApplicationAlive {
	type: typeof NotifyApplicationAlive;
}

export const GetDeviceUid = 'System.GetDeviceUid';
export interface GetDeviceUid {
	type: typeof GetDeviceUid;
}

export const GetModel = 'System.GetModel';
export interface GetModel {
	type: typeof GetModel;
}

export const GetSerialNumber = 'System.GetSerialNumber';
export interface GetSerialNumber {
	type: typeof GetSerialNumber;
}

export const NetworkGetInfo = 'Network.GetInfo';
export interface NetworkGetInfo {
	type: typeof NetworkGetInfo;
}

export const Supports = 'System.Supports';
export interface Supports {
	type: typeof Supports;
	capability: ManagementCapability;
}

export const AppUpgrade = 'System.AppUpgrade';
export interface AppUpgrade {
	type: typeof AppUpgrade;
	baseUrl: string;
	version: string;
}

export const GetTemperature = 'System.GetTemperature';
export interface GetTemperature {
	type: typeof GetTemperature;
}

export const GetBatteryStatus = 'System.GetBatteryStatus';
export interface GetBatteryStatus {
	type: typeof GetBatteryStatus;
}

export const InstallPackage = 'System.InstallPackage';
export interface InstallPackage {
	type: typeof InstallPackage;
	baseUrl: string;
	packageName: string;
	version: string;
	build: string | null;
}

export const GetCurrentTimeWithTimezone = 'System.GetCurrentTimeWithTimezone';
export interface GetCurrentTimeWithTimezone {
	type: typeof GetCurrentTimeWithTimezone;
}

export const SetManualTimeWithTimezone = 'System.SetManualTimeWithTimezone';
export interface SetManualTimeWithTimezone {
	type: typeof SetManualTimeWithTimezone;
	timestampMs: number;
	timezone: string;
}

export const SetNTPTimeWithTimezone = 'System.SetNTPTimeWithTimezone';
export interface SetNTPTimeWithTimezone {
	type: typeof SetNTPTimeWithTimezone;
	ntpServer: string;
	timezone: string;
}

export const SetDebug = 'System.SetDebug';
export interface SetDebug {
	type: typeof SetDebug;
	enabled: boolean;
}

export const RemoteControlSetEnabled = 'RemoteControl.SetEnabled';
export interface RemoteControlSetEnabled {
	type: typeof RemoteControlSetEnabled;
	enabled: boolean;
}

export const RemoteControlIsEnabled = 'RemoteControl.IsEnabled';
export interface RemoteControlIsEnabled {
	type: typeof RemoteControlIsEnabled;
}

export const ControlSetPin = 'System.ControlSetPin';
export interface ControlSetPin {
	type: typeof ControlSetPin;
	pin: string;
}

export const BrowserOpenLink = 'Browser.OpenLink';
export interface BrowserOpenLink {
	type: typeof BrowserOpenLink;
	uri: string;
}
