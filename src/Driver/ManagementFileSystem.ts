import IFileSystem, { ICopyFileOptions } from '@signageos/front-display/es6/NativeDevice/IFileSystem';
import { IFile, IFilePath, IHeaders, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import IInternalFileSystem from '../FileSystem/IFileSystem';
import { getFileUriPath } from './fileSystemHelpers';
import IFileDetailsProvider from '../FileSystem/IFileDetailsProvider';
import HashAlgorithm from '@signageos/front-display/es6/NativeDevice/HashAlgorithm';

export default class ManagementFileSystem implements IFileSystem {

	constructor(
		private fileSystemUrl: string,
		private fileSystem: IInternalFileSystem,
		private fileDetailsProvider: IFileDetailsProvider,
	) {}

	public listStorageUnits(): Promise<IStorageUnit[]> {
		return this.fileSystem.listStorageUnits();
	}

	public onStorageUnitsChanged(listener: () => void): void {
		this.fileSystem.onStorageUnitsChanged(listener);
	}

	public listFiles(directoryPath: IFilePath): Promise<IFilePath[]> {
		return this.fileSystem.listFiles(directoryPath);
	}

	public async getFile(filePath: IFilePath): Promise<IFile | null> {
		if (await this.fileSystem.exists(filePath)) {
			const localUri = this.fileSystemUrl + '/' + getFileUriPath(filePath);
			const basicFile = { localUri };
			try {
				const fileDetails = await this.fileDetailsProvider.getFileDetails(filePath);
				return {
					...basicFile,
					createdAt: fileDetails.createdAt,
					lastModifiedAt: fileDetails.lastModifiedAt,
					sizeBytes: fileDetails.sizeBytes,
					mimeType: fileDetails.mimeType,
				};
			} catch (error) {
				console.warn('Get file details failed', error);
				return basicFile;
			}
		}

		return null;
	}

	public readFile(filePath: IFilePath): Promise<string> {
		return this.fileSystem.readFile(filePath);
	}

	public writeFile(filePath: IFilePath, contents: string): Promise<void> {
		return this.fileSystem.writeFile(filePath, contents);
	}

	public exists(filePath: IFilePath): Promise<boolean> {
		return this.fileSystem.exists(filePath);
	}

	public downloadFile(filePath: IFilePath, sourceUri: string, headers?: IHeaders): Promise<void> {
		return this.fileSystem.downloadFile(filePath, sourceUri, headers);
	}

	public deleteFile(filePath: IFilePath, recursive: boolean): Promise<void> {
		return this.fileSystem.deleteFile(filePath, recursive);
	}

	public copyFile(sourceFilePath: IFilePath, destinationFilePath: IFilePath, options: ICopyFileOptions = {}): Promise<void> {
		return this.fileSystem.copyFile(sourceFilePath, destinationFilePath, options);
	}

	public moveFile(sourceFilePath: IFilePath, destinationFilePath: IFilePath): Promise<void> {
		return this.fileSystem.moveFile(sourceFilePath, destinationFilePath);
	}

	public link(sourceFilePath: IFilePath, destinationFilePath: IFilePath): Promise<void> {
		return this.fileSystem.link(sourceFilePath, destinationFilePath);
	}

	public getFileChecksum(filePath: IFilePath, hashType: HashAlgorithm): Promise<string> {
		return this.fileSystem.getFileChecksum(filePath, hashType);
	}

	public extractFile(archiveFilePath: IFilePath, destinationDirectoryPath: IFilePath, method: string): Promise<void> {
		return this.fileSystem.extractFile(archiveFilePath, destinationDirectoryPath, method);
	}

	public createDirectory(directoryPath: IFilePath): Promise<void> {
		return this.fileSystem.createDirectory(directoryPath);
	}

	public isDirectory(filePath: IFilePath): Promise<boolean> {
		return this.fileSystem.isDirectory(filePath);
	}
}
