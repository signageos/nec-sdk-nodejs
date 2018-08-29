import * as path from 'path';
import IFileSystem, { FileOrDirectoryNotFound } from '../FileSystem/IFileSystem';
import ICache from './ICache';

export default class FileSystemCache implements ICache {

	constructor(private fileSystem: IFileSystem) {}

	public async get(uid: string): Promise<string | null> {
		const filePath = this.getFilePath(uid);

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
		const filePath = this.getFilePath(uid);
		await this.fileSystem.saveToFile(filePath, content);
	}

	public async delete(uid: string): Promise<void> {
		const filePath = this.getFilePath(uid);
		await this.fileSystem.deleteFile(filePath);
	}

	private getFilePath(uid: string) {
		return path.join('cache', uid);
	}
}
