import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import IFileSystem, { FileOrDirectoryNotFound } from './IFileSystem';

export default class FileSystem implements IFileSystem {

	constructor(private baseDirectory: string) {}

	public async readFile(fileName: string): Promise<string> {
		const fullPath = this.getFullPath(fileName);
		const fileExists = await this.pathExists(fullPath);
		if (!fileExists) {
			throw new FileOrDirectoryNotFound();
		}

		const contents = await promisify(fs.readFile)(fullPath);
		return contents.toString();
	}

	public async saveToFile(fileName: string, contents: string) {
		const fullPath = this.getFullPath(fileName);
		return await promisify(fs.writeFile)(fullPath, contents);
	}

	public async deleteFile(fileName: string) {
		const fullPath = this.getFullPath(fileName);
		await promisify(fs.unlink)(fullPath);
	}

	public async getFilesInDirectory(directory: string) {
		const directoryFullPath = this.getFullPath(directory);
		const directoryExists = await this.pathExists(directoryFullPath);
		if (!directoryExists) {
			throw new FileOrDirectoryNotFound();
		}

		const filenames: string[] = await promisify(fs.readdir)(directoryFullPath);
		const result: string[] = [];

		for (let filename of filenames) {
			const fullFilePath = path.join(directoryFullPath, filename);
			if (await this.isFile(fullFilePath)) {
				result.push(filename);
			}
		}

		return result;
	}

	public async readFilesInDirectory(directory: string) {
		const directoryFullPath = this.getFullPath(directory);
		const filenames = await this.getFilesInDirectory(directoryFullPath);

		const resultPromises: { [filename: string]: Promise<string> } = {};
		for (let filename of filenames) {
			const relativeFilePath = path.join(directory, filename);
			resultPromises[filename] = this.readFile(relativeFilePath);
		}

		const result: { [filename: string]: string } = {};
		for (let filename of Object.keys(resultPromises)) {
			result[filename] = await resultPromises[filename];
		}

		return result;
	}

	private getFullPath(relativePath: string) {
		return path.join(this.baseDirectory, relativePath);
	}

	private async isFile(fullFilePath: string) {
		const stats = await promisify(fs.lstat)(fullFilePath);
		return stats.isFile();
	}

	private async pathExists(fullPath: string) {
		return await promisify(fs.exists)(fullPath);
	}
}
