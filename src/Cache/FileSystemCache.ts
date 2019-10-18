import * as path from 'path';
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import ICache, { IFileContentIndex } from '@signageos/front-display/es6/Cache/ICache';
import IFileSystem, { FileOrDirectoryNotFound } from '../FileSystem/IFileSystem';
import ICacheStorageInfo from '@signageos/front-display/es6/Cache/ICacheStorageInfo';

export default class FileSystemCache implements ICache {

	constructor(private fileSystem: IFileSystem) {}

	public async initialize() {
		const cacheDir = await this.getCacheDirectory();
		await this.fileSystem.ensureDirectory(cacheDir);
	}

	public async fetchAllUids(): Promise<string[]> {
		const cacheDir = await this.getCacheDirectory();
		const filePaths = await this.fileSystem.listFiles(cacheDir);
		return filePaths.map((filePath: IFilePath) => path.basename(filePath.filePath));
	}

	public async fetchAll(): Promise<IFileContentIndex> {
		const cacheDir = await this.getCacheDirectory();
		const filePaths = await this.fileSystem.listFiles(cacheDir);
		const fileContentIndex: IFileContentIndex = {};
		for (let filePath of filePaths) {
			const uid = path.basename(filePath.filePath);
			fileContentIndex[uid] = await this.fileSystem.readFile(filePath);
		}
		return fileContentIndex;
	}

	public async fetchOne(uid: string): Promise<string> {
		const cacheDir = await this.getCacheDirectory();
		const filePath = this.getFilePath(uid, cacheDir);

		try {
			return await this.fileSystem.readFile(filePath);
		} catch (error) {
			if (error instanceof FileOrDirectoryNotFound) {
				throw new Error('Content ' + uid + ' was not found');
			}
			throw error;
		}
	}

	public async saveOne(uid: string, content: string): Promise<void> {
		const cacheDir = await this.getCacheDirectory();
		const filePath = this.getFilePath(uid, cacheDir);
		await this.fileSystem.writeFile(filePath, content);
	}

	public async deleteOne(uid: string): Promise<void> {
		const cacheDir = await this.getCacheDirectory();
		const filePath = this.getFilePath(uid, cacheDir);
		await this.fileSystem.deleteFile(filePath);
	}

	public async getStorageInfo(): Promise<ICacheStorageInfo> {
		const internalStorageUnit = await this.getCacheDirectory();
		const totalSizeBytes = internalStorageUnit.storageUnit.capacity;
		const availableBytes = internalStorageUnit.storageUnit.usableSpace;
		return {
			totalSizeBytes,
			availableBytes,
			usedBytes: totalSizeBytes - availableBytes,
		};
	}

	private async getCacheDirectory(): Promise<IFilePath> {
		const CACHE_DIR = '.cache';
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
