export const SystemReboot = 'System.Reboot';
export interface SystemReboot {
	type: typeof SystemReboot;
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

export const SetNativeDebug = 'System.SetNativeDebug';
export interface SetNativeDebug {
	type: typeof SetNativeDebug;
	isEnabled: boolean;
}

export const NetworkGetEthernetMacAddress = 'Network.GetEthernetMacAddress';
export interface NetworkGetEthernetMacAddress {
	type: typeof NetworkGetEthernetMacAddress;
}

export const NetworkGetWifiMacAddress = 'Network.GetWifiMacAddress';
export interface NetworkGetWifiMacAddress {
	type: typeof NetworkGetWifiMacAddress;
}

export const ScreenTurnOff = 'Screen.TurnOff';
export interface ScreenTurnOff {
	type: typeof ScreenTurnOff;
}

export const ScreenTurnOn = 'Screen.TurnOn';
export interface ScreenTurnOn {
	type: typeof ScreenTurnOn;
}

export const FileSystemGetFiles = 'FileSystem.GetFiles';
export interface FileSystemGetFiles {
	type: typeof FileSystemGetFiles;
	path: string;
}

export const FileSystemFileExists = 'FileSystem.FileExists';
export interface FileSystemFileExists {
	type: typeof FileSystemFileExists;
	path: string;
}

export const FileSystemDownloadFile = 'FileSystem.DownloadFile';
export interface FileSystemDownloadFile {
	type: typeof FileSystemDownloadFile;
	path: string;
	uri: string;
	headers?: { [key: string]: string };
}

export const FileSystemDeleteFile = 'FileSystem.DeleteFile';
export interface FileSystemDeleteFile {
	type: typeof FileSystemDeleteFile;
	path: string;
}

export const FileSystemGetFileChecksum = 'FileSystem.GetFileChecksum';
export interface FileSystemGetFileChecksum {
	type: typeof FileSystemGetFileChecksum;
	path: string;
	hashAlgorithm: string;
}
