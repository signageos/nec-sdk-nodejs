import IFileSystem, { ICopyFileOptions, IMoveFileOptions } from '@signageos/front-display/es6/NativeDevice/IFileSystem';
import HashAlgorithm from '@signageos/front-display/es6/NativeDevice/HashAlgorithm';
import { IFile, IFilePath, IHeaders, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';
import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';
import BridgeClient from '../Bridge/BridgeClient';
import * as FSMessages from '../Bridge/bridgeFileSystemMessages';
import { IFileDetails } from '../FileSystem/IFileDetails';
import { getFileUriPath } from './fileSystemHelpers';

class FrontFileSystem implements IFileSystem {

	constructor(
		private fileSystemUrl: string,
		private bridge: BridgeClient,
		private socketClient: ISocket,
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
			const localUri = this.fileSystemUrl + '/' + getFileUriPath(filePath);
			const basicFile = { localUri };

			try {
				const fileDetails = await this.getFileDetails(filePath);
				return {
					...basicFile,
					...fileDetails,
				};
			} catch (error) {
				console.warn('Get file details failed', error);
				return basicFile;
			}
		}

		return null;
	}

	public async readFile(filePath: IFilePath): Promise<string> {
		const { contents } = await this.bridge.invoke<FSMessages.ReadFile, { contents: string }>({
			type: FSMessages.ReadFile,
			filePath,
		});
		return contents;
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

	public async copyFile(sourceFilePath: IFilePath, destinationFilePath: IFilePath, options: ICopyFileOptions = {}): Promise<void> {
		await this.bridge.invoke<FSMessages.CopyFile, any>({
			type: FSMessages.CopyFile,
			sourceFilePath,
			destinationFilePath,
			options,
		});
	}

	public async moveFile(sourceFilePath: IFilePath, destinationFilePath: IFilePath, options: IMoveFileOptions = {}): Promise<void> {
		await this.bridge.invoke<FSMessages.MoveFile, any>({
			type: FSMessages.MoveFile,
			sourceFilePath,
			destinationFilePath,
			options,
		});
	}

	public async link(sourceFilePath: IFilePath, destinationFilePath: IFilePath): Promise<void> {
		await this.bridge.invoke<FSMessages.Link, any>({
			type: FSMessages.Link,
			sourceFilePath,
			destinationFilePath,
		});
	}

	public async writeFile(filePath: IFilePath, contents: string): Promise<void> {
		await this.bridge.invoke<FSMessages.WriteFile, any>({
			type: FSMessages.WriteFile,
			filePath,
			contents,
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

	public onStorageUnitsChanged(listener: () => void) {
		this.socketClient.on('storage_units_changed', listener);
	}

	private async getFileDetails(filePath: IFilePath) {
		const { fileDetails } = await this.bridge.invoke<FSMessages.GetFileDetails, { fileDetails: IFileDetails }>({
			type: FSMessages.GetFileDetails,
			filePath,
		});
		return fileDetails;
	}
}

export default FrontFileSystem;
