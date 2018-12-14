import * as path from 'path';
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import IFileSystem, { FileOrDirectoryNotFound } from '../FileSystem/IFileSystem';
import ICache from './ICache';

export default class FileSystemCache implements ICache {

	constructor(private fileSystem: IFileSystem) {}

	public async get(uid: string): Promise<string | null> {
		const cacheDir = await this.getCacheDirectory();
		const filePath = this.getFilePath(uid, cacheDir);

		try {
			return await this.fileSystem.readFile(filePath);
		} catch (error) {
			if (error instanceof FileOrDirectoryNotFound) {
				return null;
			}

			throw error;
		}
	}

	public async save(uid: string, content: string): Promise<void> {
		const cacheDir = await this.getCacheDirectory();
		const filePath = this.getFilePath(uid, cacheDir);
		await this.fileSystem.ensureDirectory(cacheDir);
		await this.fileSystem.saveToFile(filePath, content);
	}

	public async delete(uid: string): Promise<void> {
		const cacheDir = await this.getCacheDirectory();
		const filePath = this.getFilePath(uid, cacheDir);
		await this.fileSystem.deleteFile(filePath);
	}

	private async getCacheDirectory(): Promise<IFilePath> {
		const CACHE_DIR = 'cache';
		const internalStorageUnit = await this.fileSystem.getInternalStorageUnit();
		return {
			storageUnit: internalStorageUnit,
			filePath: CACHE_DIR,
		};
	}

	private getFilePath(uid: string, cacheDir: IFilePath): IFilePath {
		return {
			storageUnit: cacheDir.storageUnit,
			filePath: path.join(cacheDir.filePath, uid),
		};
	}
}
