import * as path from 'path';
import * as crypto from "crypto";
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import IFileSystem from './IFileSystem';
import { IExtendedFileDetails } from './IFileDetails';
import IFileMetadataCache from './IFileMetadataCache';

const KEY_VIDEO_DURATION = 'vd';

export default class FileMetadataCache implements IFileMetadataCache {

	constructor(
		private fileSystem: IFileSystem,
	) {}

	public async getFileMetadata(filePath: IFilePath, lastModifiedAt: number): Promise<IExtendedFileDetails> {
		const metadataFilePath = this.getMetadataFilePath(filePath, lastModifiedAt);
		return this.getMetadata(metadataFilePath);
	}

	public async saveFileMetadata(filePath: IFilePath, lastModifiedAt: number, metadata: IExtendedFileDetails) {
		const metadataFilePath = this.getMetadataFilePath(filePath, lastModifiedAt);
		await this.saveMetadata(metadataFilePath, metadata);
	}

	private getMetadataFilePath(filePath: IFilePath, lastModifiedAt: number) {
		const METADATA_SUBDIR = '.metadata';
		const parentDirectoryPath = path.dirname(filePath.filePath);
		const metadataFileName = this.getMetadataFileName(filePath, lastModifiedAt);
		const metadataFilePath = path.join(parentDirectoryPath, METADATA_SUBDIR, metadataFileName);
		return {
			...filePath,
			filePath: metadataFilePath,
		};
	}

	private getMetadataFileName(filePath: IFilePath, lastModifiedAt: number) {
		const fileName = path.basename(filePath.filePath) + '_' + lastModifiedAt;
		return crypto.createHash('md5').update(fileName).digest('hex');
	}

	private async getMetadata(metadataFilePath: IFilePath): Promise<IExtendedFileDetails> {
		const metadataRawFileContents = await this.fileSystem.readFile(metadataFilePath);
		let metadata: IExtendedFileDetails = {};
		for (let metadataFileRow of metadataRawFileContents.split("\n")) {
			metadata = {
				...metadata,
				...this.parseMetadataFileRow(metadataFileRow),
			};
		}
		return metadata;
	}

	private parseMetadataFileRow(row: string): Partial<IExtendedFileDetails> {
		const [key, value] = row.split(':');
		switch (key) {
			case KEY_VIDEO_DURATION:
				return {
					videoDurationMs: parseInt(value),
				};
			default:
				return {};
		}
	}

	private async saveMetadata(metadataFilePath: IFilePath, metadata: IExtendedFileDetails) {
		const fileContents = this.convertMetadataToFileString(metadata);
		if (fileContents) {
			const metadataFileParentDirectoryPath = {
				...metadataFilePath,
				filePath: path.dirname(metadataFilePath.filePath),
			};
			await this.fileSystem.ensureDirectory(metadataFileParentDirectoryPath);
			await this.fileSystem.writeFile(metadataFilePath, fileContents);
		}
	}

	private convertMetadataToFileString(metadata: IExtendedFileDetails) {
		const metadataFileRows: string[] = [];
		for (let key of Object.keys(metadata) as (keyof IExtendedFileDetails)[]) {
			const row = this.convertMetadataKeyValuePairIntoFileRow(key, metadata[key]);
			if (row) {
				metadataFileRows.push(row);
			}
		}
		return metadataFileRows.join("\n");
	}

	private convertMetadataKeyValuePairIntoFileRow(
		key: keyof IExtendedFileDetails,
		value: IExtendedFileDetails[keyof IExtendedFileDetails],
	) {
		switch (key) {
			case 'videoDurationMs':
				return KEY_VIDEO_DURATION + ':' + value;
			default:
				return null;
		}
	}
}
