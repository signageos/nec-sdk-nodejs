import { IFilePath, IHeaders } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import HashAlgorithm from '@signageos/front-display/es6/NativeDevice/HashAlgorithm';

export const ListFiles = 'FileSystem.ListFiles';
export interface ListFiles {
	type: typeof ListFiles;
	directoryPath: IFilePath;
}

export const FileExists = 'FileSystem.FileExists';
export interface FileExists {
	type: typeof FileExists;
	filePath: IFilePath;
}

export const DownloadFile = 'FileSystem.DownloadFile';
export interface DownloadFile {
	type: typeof DownloadFile;
	filePath: IFilePath;
	sourceUri: string;
	headers?: IHeaders;
}

export const DeleteFile = 'FileSystem.DeleteFile';
export interface DeleteFile {
	type: typeof DeleteFile;
	filePath: IFilePath;
	recursive: boolean;
}

export const MoveFile = 'FileSystem.MoveFile';
export interface MoveFile {
	type: typeof MoveFile;
	sourceFilePath: IFilePath;
	destinationFilePath: IFilePath;
}

export const WriteFile = 'FileSystem.WriteFile';
export interface WriteFile {
	type: typeof WriteFile;
	filePath: IFilePath;
	contents: string;
}

export const GetFileDetails = 'FileSystem.GetFileDetails';
export interface GetFileDetails {
	type: typeof GetFileDetails;
	filePath: IFilePath;
}

export const GetFileChecksum = 'FileSystem.GetFileChecksum';
export interface GetFileChecksum {
	type: typeof GetFileChecksum;
	filePath: IFilePath;
	hashType: HashAlgorithm;
}

export const ExtractFile = 'FileSystem.ExtractFile';
export interface ExtractFile {
	type: typeof ExtractFile;
	archiveFilePath: IFilePath;
	destinationDirectoryPath: IFilePath;
	method: string;
}

export const CreateDirectory = 'FileSystem.CreateDirectory';
export interface CreateDirectory {
	type: typeof CreateDirectory;
	directoryPath: IFilePath;
}

export const IsDirectory = 'FileSystem.IsDirectory';
export interface IsDirectory {
	type: typeof IsDirectory;
	filePath: IFilePath;
}

export const ListStorageUnits = 'FileSystem.ListStorageUnits';
export interface ListStorageUnits {
	type: typeof ListStorageUnits;
}
