import { IFilePath, IHeaders, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import HashAlgorithm from '@signageos/front-display/es6/NativeDevice/HashAlgorithm';

export const TMP_ABSOLUTE_PATH = '/tmp/signageos';
export const EXTERNAL_STORAGE_UNITS_PATH = 'external';
export const DATA_DIRECTORY_PATH = 'data';
export const TMP_STORAGE_UNIT = 'tmp';
export const INTERNAL_STORAGE_UNIT = 'internal';

export default interface IFileSystem {
	listFiles(directoryPath: IFilePath): Promise<IFilePath[]>;
	exists(filePath: IFilePath): Promise<boolean>;
	downloadFile(filePath: IFilePath, sourceUri: string, headers?: IHeaders): Promise<void>;
	uploadFile(filePath: IFilePath, formKey: string, uri: string, headers?: { [key: string]: string }): Promise<any>;
	readFile(filePath: IFilePath): Promise<string>;
	saveToFile(filePath: IFilePath, contents: string | Buffer): Promise<void>;
	deleteFile(filePath: IFilePath, recursive?: boolean): Promise<void>;
	moveFile(sourceFilePath: IFilePath, destinationFilePath: IFilePath): Promise<void>;
	getFileChecksum(filePath: IFilePath, hashType: HashAlgorithm): Promise<string>;
	extractFile(archiveFilePath: IFilePath, destinationDirectoryPath: IFilePath, method: string): Promise<void>;
	createDirectory(directoryPath: IFilePath): Promise<void>;
	ensureDirectory(directoryPath: IFilePath): Promise<void>;
	isDirectory(filePath: IFilePath): Promise<boolean>;
	listStorageUnits(): Promise<IStorageUnit[]>;
	onStorageUnitsChanged(listener: () => void): void;
	getInternalStorageUnit(): Promise<IStorageUnit>;
	getTmpStorageUnit(): IStorageUnit;
	getAbsolutePath(filePath: IFilePath): string;
	convertRelativePathToFilePath(relativePath: string): Promise<IFilePath>;
}

export class FileOrDirectoryNotFound extends Error {}
