import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import IFileSystem, { FileOrDirectoryNotFound } from './IFileSystem';
import { downloadFile } from './downloadFile';

export default class FileSystem implements IFileSystem {

	constructor(private baseDirectory: string) {}

	public async readFile(fileName: string): Promise<string> {
		const fileExists = await this.pathExists(fileName);
		if (!fileExists) {
			throw new FileOrDirectoryNotFound();
		}

		const fullPath = this.getFullPath(fileName);
		const contents = await promisify(fs.readFile)(fullPath);
		return contents.toString();
	}

	public async saveToFile(fileName: string, contents: string) {
		const fullPath = this.getFullPath(fileName);
		const directory = path.dirname(fullPath);
		await promisify(mkdirp)(directory);
		return await promisify(fs.writeFile)(fullPath, contents);
	}

	public async deleteFile(fileName: string) {
		const fileExists = await this.pathExists(fileName);
		if (!fileExists) {
			throw new FileOrDirectoryNotFound();
		}

		const fullPath = this.getFullPath(fileName);
		await promisify(fs.unlink)(fullPath);
	}

	public async downloadFile(destinationPath: string, uri: string, headers?: { [key: string]: string }) {
		const fullDestinationPath = this.getFullPath(destinationPath);
		const destinationDirectory = path.dirname(fullDestinationPath);
		await promisify(mkdirp)(destinationDirectory);
		const file = fs.createWriteStream(fullDestinationPath);
		await downloadFile(file, uri, headers);
	}

	public async getFilesInDirectory(directory: string) {
		const directoryExists = await this.pathExists(directory);
		if (!directoryExists) {
			throw new FileOrDirectoryNotFound();
		}

		const directoryFullPath = this.getFullPath(directory);
		const filenames: string[] = await promisify(fs.readdir)(directoryFullPath);
		const result: string[] = [];

		for (let filename of filenames) {
			const relativeFilePath = path.join(directory, filename);
			if (await this.isFile(relativeFilePath)) {
				result.push(filename);
			}
		}

		return result;
	}

	public async readFilesInDirectory(directory: string) {
		const filenames = await this.getFilesInDirectory(directory);

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

	public getFullPath(relativePath: string) {
		return path.join(this.baseDirectory, relativePath);
	}

	public async isFile(fileName: string) {
		const fullPath = this.getFullPath(fileName);
		const stats = await promisify(fs.lstat)(fullPath);
		return stats.isFile();
	}

	public async pathExists(relativePath: string) {
		const fullPath = this.getFullPath(relativePath);
		return await promisify(fs.exists)(fullPath);
	}
}
