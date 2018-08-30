export const SystemReboot = 'System.Reboot';
export interface SystemReboot {
	type: typeof SystemReboot;
}

export const GetModel = 'System.GetModel';
export interface GetModel {
	type: typeof GetModel;
}

export const FileSystemGetFiles = 'FileSystem.GetFiles';
export interface FileSystemGetFiles {
	type: typeof FileSystemGetFiles;
	path: string;
}

export const FileSystemGetFile = 'FileSystem.GetFile';
export interface FileSystemGetFile {
	type: typeof FileSystemGetFile;
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
