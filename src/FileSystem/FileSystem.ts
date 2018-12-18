import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as checksum from 'checksum';
import { IFilePath, IHeaders, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import HashAlgorithm from '@signageos/front-display/es6/NativeDevice/HashAlgorithm';
import {
	IStorageUnit as ISystemStorageUnit,
	getStorageStatus,
} from '../API/SystemAPI';
import IFileSystem, {
	TMP_STORAGE_UNIT,
	INTERNAL_STORAGE_UNIT,
	TMP_ABSOLUTE_PATH,
	DATA_DIRECTORY_PATH,
	EXTERNAL_STORAGE_UNITS_PATH,
	FileOrDirectoryNotFound,
} from './IFileSystem';
import { downloadFile } from './downloadFile';
import { uploadFile } from './uploadFile';
import { unzip } from './archive';

export default class FileSystem implements IFileSystem {

	constructor(private baseDirectory: string) {}

	public async initialize() {
		const storageUnits = await this.listStorageUnits();
		await Promise.all(
			storageUnits.map(async (storageUnit: IStorageUnit) => {
				const rootFilePath = {
					filePath: '',
					storageUnit,
				} as IFilePath;
				await this.ensureDirectory(rootFilePath);
			}),
		);
	}

	public async listFiles(directoryPath: IFilePath): Promise<IFilePath[]> {
		const directoryExists = await this.exists(directoryPath);
		if (!directoryExists) {
			throw new FileOrDirectoryNotFound();
		}

		const isDirectory = await this.isDirectory(directoryPath);
		if (!isDirectory) {
			throw new Error('Path isn\'t directory');
		}

		const absolutePath = this.getAbsolutePath(directoryPath);
		const filenames: string[] = await fs.readdir(absolutePath);
		return filenames.map((filename: string) => ({
			storageUnit: directoryPath.storageUnit,
			filePath: this.trimSlashesAndDots(path.join(directoryPath.filePath, filename)),
		} as IFilePath));
	}

	public async exists(filePath: IFilePath) {
		const absolutePath = this.getAbsolutePath(filePath);
		return await fs.pathExists(absolutePath);
	}

	public async downloadFile(filePath: IFilePath, sourceUri: string, headers?: IHeaders) {
		if (await this.exists(filePath) && await this.isDirectory(filePath)) {
			throw new Error('Trying to download file but a directory already exists in the destination');
		}

		const destinationFilePath = this.getParentDirectoryFilePath(filePath);
		if (!(await this.exists(destinationFilePath))) {
			throw new Error('Download destination doesn\'t exist');
		}
		if (!(await this.isDirectory(destinationFilePath))) {
			throw new Error('Download destination isn\'t a directory');
		}

		const absolutePath = this.getAbsolutePath(filePath);
		const file = fs.createWriteStream(absolutePath);
		await downloadFile(file, sourceUri, headers);
	}

	public async uploadFile(filePath: IFilePath, formKey: string, uri: string, headers?: { [key: string]: string }) {
		const fileExists = await this.exists(filePath);
		if (!fileExists) {
			throw new FileOrDirectoryNotFound();
		}

		if (await this.isDirectory(filePath)) {
			throw new Error('uploadFile: can\'t upload a directory');
		}

		const absolutePath = this.getAbsolutePath(filePath);
		const file = fs.createReadStream(absolutePath);
		return await uploadFile(file, formKey, uri, headers);
	}

	public async readFile(filePath: IFilePath): Promise<string> {
		const fileExists = await this.exists(filePath);
		if (!fileExists) {
			throw new FileOrDirectoryNotFound();
		}

		if (await this.isDirectory(filePath)) {
			throw new Error('readFile: can\'t read a directory');
		}

		const absolutePath = this.getAbsolutePath(filePath);
		const contents = await fs.readFile(absolutePath);
		return contents.toString();
	}

	public async saveToFile(filePath: IFilePath, contents: string | Buffer) {
		const fullPath = this.getAbsolutePath(filePath);
		return await fs.writeFile(fullPath, contents);
	}

	public async deleteFile(filePath: IFilePath, recursive: boolean = false) {
		const absolutePath = this.getAbsolutePath(filePath);
		if (await this.isDirectory(filePath)) {
			if (this.isRootDirectory(filePath)) {
				throw new Error('Can\'t delete root directory');
			}
			if (recursive) {
				await fs.remove(absolutePath);
			} else {
				await fs.rmdir(absolutePath); // fails if the directory isn't empty
			}
		} else {
			await fs.remove(absolutePath);
		}
	}

	public async moveFile(sourceFilePath: IFilePath, destinationFilePath: IFilePath) {
		const sourceExists = await this.exists(sourceFilePath);
		if (!sourceExists) {
			throw new FileOrDirectoryNotFound();
		}

		if (this.isRootDirectory(sourceFilePath)) {
			throw new Error('Can\'t move root directory');
		}
		if (await this.exists(destinationFilePath)) {
			throw new Error('Trying to move to an existing destination');
		}

		const destinationParentDirectoryFilePath = this.getParentDirectoryFilePath(destinationFilePath);
		if (!(await this.exists(destinationParentDirectoryFilePath))) {
			throw new Error('Can\'t move file to a non-existent directory');
		}
		if (!(await this.isDirectory(destinationParentDirectoryFilePath))) {
			throw new Error('Trying to move file but the destination is a file, not a directory');
		}

		const sourceAbsolutePath = this.getAbsolutePath(sourceFilePath);
		const destinationAbsolutePath = this.getAbsolutePath(destinationFilePath);
		await fs.move(sourceAbsolutePath, destinationAbsolutePath);
	}

	public async getFileChecksum(filePath: IFilePath, hashType: HashAlgorithm): Promise<string> {
		const fileExists = await this.exists(filePath);
		if (!fileExists) {
			throw new FileOrDirectoryNotFound();
		}

		if (await this.isDirectory(filePath)) {
			throw new Error('Can\'t get checksum of a directory');
		}

		const absolutePath = this.getAbsolutePath(filePath);
		const getChecksum = promisify<string, checksum.ChecksumOptions, string>(checksum.file);
		return await getChecksum(absolutePath, { algorithm: hashType });
	}

	public async extractFile(archiveFilePath: IFilePath, destinationDirectoryPath: IFilePath, method: string) {
		if (method !== 'zip') {
			throw new Error(`Unsupported extract method ${method}`);
		}

		const archiveExists = await this.exists(archiveFilePath);
		if (!archiveExists) {
			throw new FileOrDirectoryNotFound();
		}

		await this.ensureDirectory(destinationDirectoryPath);
		const absoluteArchivePath = this.getAbsolutePath(archiveFilePath);
		const absoluteDestinationPath = this.getAbsolutePath(destinationDirectoryPath);
		await unzip(absoluteArchivePath, absoluteDestinationPath);
	}

	public async createDirectory(directoryPath: IFilePath) {
		if (await this.exists(directoryPath)) {
			throw new Error('Directory already exists');
		}

		const absolutePath = this.getAbsolutePath(directoryPath);
		await fs.mkdir(absolutePath);
	}

	public async ensureDirectory(directoryPath: IFilePath): Promise<void> {
		const absolutePath = this.getAbsolutePath(directoryPath);
		await fs.ensureDir(absolutePath);
	}

	public async isDirectory(filePath: IFilePath): Promise<boolean> {
		const fileExists = await this.exists(filePath);
		if (!fileExists) {
			throw new FileOrDirectoryNotFound();
		}

		const absolutePath = this.getAbsolutePath(filePath);
		const stats = await fs.lstat(absolutePath);
		return stats.isDirectory();
	}

	public async listStorageUnits() {
		const storageUnits = await getStorageStatus();
		return storageUnits.map((storageUnit: ISystemStorageUnit) => ({
			type: storageUnit.type,
			capacity: storageUnit.availableSpace + storageUnit.usedSpace,
			freeSpace: storageUnit.availableSpace,
			usableSpace: storageUnit.availableSpace,
			removable: storageUnit.type !== INTERNAL_STORAGE_UNIT,
		}));
	}

	public onStorageUnitsChanged(_listener: () => void): void {
		// implement
	}

	public async getInternalStorageUnit(): Promise<IStorageUnit> {
		const storageUnits = await this.listStorageUnits();
		for (let storageUnit of storageUnits) {
			if (storageUnit.type === INTERNAL_STORAGE_UNIT) {
				return storageUnit;
			}
		}

		throw new Error('Internal storage unit not found');
	}

	public getTmpStorageUnit(): IStorageUnit {
		return {
			type: TMP_STORAGE_UNIT,
			capacity: 0,
			freeSpace: 0,
			usableSpace: 0,
			removable: false,
		};
	}

	public getAbsolutePath(filePath: IFilePath) {
		if (filePath.storageUnit.type === TMP_STORAGE_UNIT) {
			return path.join(TMP_ABSOLUTE_PATH, filePath.filePath.trim());
		}
		let basePath = this.baseDirectory;
		if (filePath.storageUnit.removable) {
			basePath = path.join(basePath, EXTERNAL_STORAGE_UNITS_PATH);
		}

		return path.join(basePath, filePath.storageUnit.type, DATA_DIRECTORY_PATH, filePath.filePath.trim());
	}

	public async convertRelativePathToFilePath(relativePath: string): Promise<IFilePath> {
		if (relativePath.startsWith(EXTERNAL_STORAGE_UNITS_PATH)) {
			return await this.convertExternalRelativePathToFilePath(relativePath);
		} else {
			return await this.convertInternalRelativePathToFilePath(relativePath);
		}
	}

	private async convertInternalRelativePathToFilePath(relativePath: string): Promise<IFilePath> {
		const startsWith = INTERNAL_STORAGE_UNIT + '/' + DATA_DIRECTORY_PATH;
		if (!relativePath.startsWith(startsWith)) {
			throw new Error('Invalid path ' + relativePath);
		}

		let filePath = relativePath.substring(startsWith.length);
		filePath = this.trimSlashesAndDots(filePath);
		const internalStorageUnit = await this.getInternalStorageUnit();

		return {
			storageUnit: internalStorageUnit,
			filePath,
		};
	}

	private async convertExternalRelativePathToFilePath(relativePath: string): Promise<IFilePath> {
		const [external, storageUnitType, dataSubdir] = relativePath.split('/', 3);
		if (external !== EXTERNAL_STORAGE_UNITS_PATH || dataSubdir !== DATA_DIRECTORY_PATH) {
			throw new Error('Invalid path ' + relativePath);
		}

		const startsWith = external + '/' + storageUnitType + '/' + dataSubdir;
		let filePath = relativePath.substring(startsWith.length);
		filePath = this.trimSlashesAndDots(filePath);

		const storageUnits = await this.listStorageUnits();
		for (let storageUnit of storageUnits) {
			if (storageUnit.type === storageUnitType) {
				return {
					storageUnit,
					filePath,
				};
			}
		}

		throw new Error('Invalid path ' + relativePath);
	}

	private getParentDirectoryFilePath(filePath: IFilePath): IFilePath {
		return {
			storageUnit: filePath.storageUnit,
			filePath: path.dirname(filePath.filePath),
		};
	}

	private isRootDirectory(filePath: IFilePath) {
		return filePath.filePath.trim() === "";
	}

	private trimSlashesAndDots(filePath: string) {
		if (filePath.indexOf('.') === 0) {
			filePath = filePath.substring(1);
		}
		filePath = filePath.replace(/\/\.\//g, '/');
		filePath = filePath.replace(/\/+/g, '/');
		filePath = filePath.replace(/\/+$/g, '');
		filePath = filePath.replace(/^\/+/g, '');
		return filePath;
	}
}
