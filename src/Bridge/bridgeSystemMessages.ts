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
