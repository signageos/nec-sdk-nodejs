import IFileSystem from '@signageos/front-display/es6/NativeDevice/Front/IFileSystem';
import HashAlgorithm from '@signageos/front-display/es6/NativeDevice/HashAlgorithm';
import { IFile, IFilePath, IHeaders, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';
import BridgeClient from '../Bridge/BridgeClient';
import * as FSMessages from '../Bridge/bridgeFileSystemMessages';
import {
	DATA_DIRECTORY_PATH,
	EXTERNAL_STORAGE_UNITS_PATH,
} from '../FileSystem/IFileSystem';

class FrontFileSystem implements IFileSystem {

	constructor(
		private fileSystemUrl: string,
		private bridge: BridgeClient,
	) {}

	public async listFiles(directoryPath: IFilePath): Promise<IFilePath[]> {
		const { files } = await this.bridge.invoke<FSMessages.ListFiles, { files: IFilePath[] }>({
			type: FSMessages.ListFiles,
			directoryPath,
		});
		return files;
	}

	public async getFile(filePath: IFilePath): Promise<IFile | null> {
		if (await this.exists(filePath)) {
			let uriPath = `${filePath.storageUnit.type}/${DATA_DIRECTORY_PATH}/${filePath.filePath}`;
			if (filePath.storageUnit.removable) {
				uriPath = EXTERNAL_STORAGE_UNITS_PATH + '/' + uriPath;
			}
			const fileLocalUri = this.fileSystemUrl + '/' + uriPath;
			return {
				localUri: fileLocalUri,
			};
		}

		return null;
	}

	public async exists(filePath: IFilePath): Promise<boolean> {
		const { exists } = await this.bridge.invoke<FSMessages.FileExists, { exists: boolean }>({
			type: FSMessages.FileExists,
			filePath,
		});
		return exists;
	}

	@locked('client_download')
	public async downloadFile(filePath: IFilePath, sourceUri: string, headers?: IHeaders): Promise<void> {
		await this.bridge.invoke<FSMessages.DownloadFile, any>({
			type: FSMessages.DownloadFile,
			filePath,
			sourceUri,
			headers,
		});
	}

	public async deleteFile(filePath: IFilePath, recursive: boolean): Promise<void> {
		await this.bridge.invoke<FSMessages.DeleteFile, any>({
			type: FSMessages.DeleteFile,
			filePath,
			recursive,
		});
	}

	public async moveFile(sourceFilePath: IFilePath, destinationFilePath: IFilePath): Promise<void> {
		await this.bridge.invoke<FSMessages.MoveFile, any>({
			type: FSMessages.MoveFile,
			sourceFilePath,
			destinationFilePath,
		});
	}

	public async getFileChecksum(filePath: IFilePath, hashType: HashAlgorithm): Promise<string> {
		const { checksum } = await this.bridge.invoke<FSMessages.GetFileChecksum, { checksum: string }>({
			type: FSMessages.GetFileChecksum,
			filePath,
			hashType,
		});
		return checksum;
	}

	public async extractFile(archiveFilePath: IFilePath, destinationDirectoryPath: IFilePath, method: string): Promise<void> {
		await this.bridge.invoke<FSMessages.ExtractFile, any>({
			type: FSMessages.ExtractFile,
			archiveFilePath,
			destinationDirectoryPath,
			method,
		});
	}

	public async createDirectory(directoryPath: IFilePath): Promise<void> {
		await this.bridge.invoke<FSMessages.CreateDirectory, any>({
			type: FSMessages.CreateDirectory,
			directoryPath,
		});
	}

	public async isDirectory(filePath: IFilePath): Promise<boolean> {
		const { isDirectory } = await this.bridge.invoke<FSMessages.IsDirectory, { isDirectory: boolean }>({
			type: FSMessages.IsDirectory,
			filePath,
		});
		return isDirectory;
	}

	public async listStorageUnits(): Promise<IStorageUnit[]> {
		const { storageUnits } = await this.bridge.invoke<FSMessages.ListStorageUnits, { storageUnits: IStorageUnit[] }>({
			type: FSMessages.ListStorageUnits,
		});
		return storageUnits;
	}

	public onStorageUnitsChanged(_listener: () => void): void {
		// TODO implement
	}
}

export default FrontFileSystem;
