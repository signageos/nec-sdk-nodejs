import { EventEmitter } from 'events';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as checksum from 'checksum';
import { IFilePath, IHeaders, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import HashAlgorithm from '@signageos/front-display/es6/NativeDevice/HashAlgorithm';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';
import {
	IStorageUnit as ISystemStorageUnit,
	getStorageStatus,
	getFileMimeType,
} from '../API/SystemAPI';
import IFileSystem, {
	TMP_STORAGE_UNIT,
	APP_FILES_STORAGE_UNIT,
	INTERNAL_STORAGE_UNIT,
	TMP_DIRECTORY_PATH,
	EXTERNAL_STORAGE_UNITS_PATH,
	FileOrDirectoryNotFound,
} from './IFileSystem';
import { IFileDetails } from './IFileDetails';
import { downloadFile } from './downloadFile';
import { uploadFile } from './uploadFile';
import { unzip } from './archive';
import { trimSlashesAndDots } from './helper';

const EVENT_STORAGE_UNITS_CHANGED = 'storage_units_changed';

export default class FileSystem implements IFileSystem {

	private eventEmitter: EventEmitter;

	constructor(
		private baseDirectory: string,
		private tmpDirectory: string,
		private appFilesDirectory: string,
		private storageUnitsChangedSignal: NodeJS.Signals,
	) {
		this.eventEmitter = new EventEmitter();
		this.listenToStorageUnitsChanged();
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
			filePath: trimSlashesAndDots(path.join(directoryPath.filePath, filename)),
		} as IFilePath));
	}

	public async exists(filePath: IFilePath) {
		const absolutePath = this.getAbsolutePath(filePath);
		return await fs.pathExists(absolutePath);
	}

	@locked('server_download')
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

		const tmpDownloadFilePath = this.getTmpDownloadFilePath(filePath);
		const tmpDownloadAbsolutePath = this.getAbsolutePath(tmpDownloadFilePath);
		const file = fs.createWriteStream(tmpDownloadAbsolutePath);
		await downloadFile(file, sourceUri, headers);
		await this.moveFile(tmpDownloadFilePath, filePath, true);
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

	public async getFileDetails(filePath: IFilePath): Promise<IFileDetails> {
		const fileExists = await this.exists(filePath);
		if (!fileExists) {
			throw new FileOrDirectoryNotFound();
		}

		if (await this.isDirectory(filePath)) {
			throw new Error('only can get details of files, not directories');
		}

		const absolutePath = this.getAbsolutePath(filePath);
		const fileStats = await fs.stat(absolutePath);

		let mimeType: string | undefined = undefined;
		try {
			mimeType = await getFileMimeType(absolutePath);
		} catch (error) {
			console.warn('failed to get mime type', error);
		}

		return {
			createdAt: fileStats.birthtime.valueOf(),
			lastModifiedAt: fileStats.birthtime.valueOf(),
			sizeBytes: fileStats.size,
			mimeType,
		};
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

	public async writeFile(filePath: IFilePath, contents: string | Buffer) {
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

	public async copyFile(sourceFilePath: IFilePath, destinationFilePath: IFilePath): Promise<void> {
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
		await fs.copy(sourceAbsolutePath, destinationAbsolutePath);
	}

	public async moveFile(sourceFilePath: IFilePath, destinationFilePath: IFilePath, overwrite: boolean = false) {
		const sourceExists = await this.exists(sourceFilePath);
		if (!sourceExists) {
			throw new FileOrDirectoryNotFound();
		}

		if (this.isRootDirectory(sourceFilePath)) {
			throw new Error('Can\'t move root directory');
		}
		if (!overwrite && await this.exists(destinationFilePath)) {
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
		await fs.move(sourceAbsolutePath, destinationAbsolutePath, { overwrite });
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

	public onStorageUnitsChanged(listener: () => void) {
		this.eventEmitter.addListener(EVENT_STORAGE_UNITS_CHANGED, listener);
	}

	public removeStorageUnitsChangedListener(listener: () => void) {
		this.eventEmitter.removeListener(EVENT_STORAGE_UNITS_CHANGED, listener);
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

	public getAppFilesStorageUnit(): IStorageUnit {
		return {
			type: APP_FILES_STORAGE_UNIT,
			capacity: 0,
			freeSpace: 0,
			usableSpace: 0,
			removable: false,
		};
	}

	public getAbsolutePath(filePath: IFilePath) {
		switch (filePath.storageUnit.type) {
			case TMP_STORAGE_UNIT:
				return path.join(this.tmpDirectory, TMP_DIRECTORY_PATH, filePath.filePath.trim());
			case APP_FILES_STORAGE_UNIT:
				return path.join(this.appFilesDirectory, filePath.filePath.trim());
			default:
				let basePath = this.baseDirectory;
				if (filePath.storageUnit.removable) {
					basePath = path.join(basePath, EXTERNAL_STORAGE_UNITS_PATH);
				}
				return path.join(basePath, filePath.storageUnit.type, filePath.filePath.trim());
		}
	}

	public async convertRelativePathToFilePath(relativePath: string): Promise<IFilePath> {
		if (relativePath.startsWith(EXTERNAL_STORAGE_UNITS_PATH)) {
			return await this.convertExternalRelativePathToFilePath(relativePath);
		} else {
			return await this.convertInternalRelativePathToFilePath(relativePath);
		}
	}

	private async convertInternalRelativePathToFilePath(relativePath: string): Promise<IFilePath> {
		const startsWith = INTERNAL_STORAGE_UNIT;
		if (!relativePath.startsWith(startsWith)) {
			throw new Error('Invalid path ' + relativePath);
		}

		let filePath = relativePath.substring(startsWith.length);
		filePath = trimSlashesAndDots(filePath);
		const internalStorageUnit = await this.getInternalStorageUnit();

		return {
			storageUnit: internalStorageUnit,
			filePath,
		};
	}

	private async convertExternalRelativePathToFilePath(relativePath: string): Promise<IFilePath> {
		const [external, storageUnitType] = relativePath.split('/', 2);
		if (external !== EXTERNAL_STORAGE_UNITS_PATH) {
			throw new Error('Invalid path ' + relativePath);
		}

		const startsWith = external + '/' + storageUnitType;
		let filePath = relativePath.substring(startsWith.length);
		filePath = trimSlashesAndDots(filePath);

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

	private getTmpDownloadFilePath(destinationFilePath: IFilePath): IFilePath {
		const parentDirectoryFilePath = this.getParentDirectoryFilePath(destinationFilePath);
		const fileName = path.basename(destinationFilePath.filePath);
		const tmpFileName = '.' + fileName + '.part';
		return {
			storageUnit: destinationFilePath.storageUnit,
			filePath: path.join(parentDirectoryFilePath.filePath, tmpFileName),
		};
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

	private listenToStorageUnitsChanged() {
		process.on(this.storageUnitsChangedSignal, () => {
			this.eventEmitter.emit(EVENT_STORAGE_UNITS_CHANGED);
		});
	}
}
