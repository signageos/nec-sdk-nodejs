import * as path from 'path';
import * as fs from 'fs';
import * as express from 'express';
import * as sharp from 'sharp';
import * as crypto from "crypto";
import { IFilePath, IStorageUnit } from "@signageos/front-display/es6/NativeDevice/fileSystem";
import { EXTERNAL_STORAGE_UNITS_PATH, INTERNAL_STORAGE_UNIT } from '../IFileSystem';
import IInternalFileSystem from '../../FileSystem/IFileSystem';
import { getFileUriPath } from '../../Driver/fileSystemHelpers';

// tslint:disable:max-line-length
const THUMBNAIL_SUBDIR = '.thumbnails';
const THUMBNAIL_FILE_NAME_REGEX_RAW = `([^/]+)_image_(\\d+)x(\\d+)_(\\w+)`;
const THUMBNAIL_FILE_NAME_REGEX = new RegExp(THUMBNAIL_FILE_NAME_REGEX_RAW);
const THUMBNAIL_EXTERNAL_ROUTE_REGEX = new RegExp(`^/${EXTERNAL_STORAGE_UNITS_PATH}/(\\w+)/(.*/?${THUMBNAIL_SUBDIR}/${THUMBNAIL_FILE_NAME_REGEX_RAW})$`);
const THUMBNAIL_INTERNAL_ROUTE_REGEX = new RegExp(`^/(${INTERNAL_STORAGE_UNIT})/(.*/?${THUMBNAIL_SUBDIR}/${THUMBNAIL_FILE_NAME_REGEX_RAW})$`);
// tslint:enable

export default class ImageResizer {

	constructor(
		private fileSystemUrl: string,
		private expressApp: express.Application,
		private fileSystem: IInternalFileSystem,
	) {
		this.routeResizing();
	}

	public getImageThumbnailUriTemplate(filePath: IFilePath, lastModifiedAt: number) {
		const WIDTH_PLACEHOLDER = '{width}';
		const HEIGHT_PLACEHOLDER = '{height}';
		const thumbnailFilePath = this.getThumbnailFilePath(filePath, WIDTH_PLACEHOLDER, HEIGHT_PLACEHOLDER, lastModifiedAt);
		let filePathname = getFileUriPath(thumbnailFilePath);
		filePathname = filePathname.replace(encodeURI(WIDTH_PLACEHOLDER), WIDTH_PLACEHOLDER);
		filePathname = filePathname.replace(encodeURI(HEIGHT_PLACEHOLDER), HEIGHT_PLACEHOLDER);
		return `${this.fileSystemUrl}/${filePathname}`;
	}

	private routeResizing() {
		this.expressApp.get(THUMBNAIL_EXTERNAL_ROUTE_REGEX, this.handleResizing(THUMBNAIL_EXTERNAL_ROUTE_REGEX));
		this.expressApp.get(THUMBNAIL_INTERNAL_ROUTE_REGEX, this.handleResizing(THUMBNAIL_INTERNAL_ROUTE_REGEX));
	}

	private handleResizing = (routeRegex: RegExp) => async (req: express.Request, res: express.Response) => {
		const reqParams = req.path.match(routeRegex)!;
		const storageUnitType: string = decodeURI(reqParams[1]) || INTERNAL_STORAGE_UNIT;
		const storageUnits = await this.fileSystem.listStorageUnits();
		const storageUnit = storageUnits.find((unit: IStorageUnit) => unit.type === storageUnitType);

		if (!storageUnit) {
			res.status(400).send(`Storage unit doesn't exist: ${storageUnitType}`);
			return;
		}

		const thumbnailFilePath: IFilePath = {
			storageUnit,
			filePath: decodeURI(reqParams[2]),
		};
		const thumbnailAbsolutePath = this.fileSystem.getAbsolutePath(thumbnailFilePath);

		if (await this.fileSystem.exists(thumbnailFilePath)) {
			this.pipeFileToResponse(thumbnailAbsolutePath, res);
			return;
		}

		const thumbnailsDirectoryPath = path.dirname(thumbnailFilePath.filePath);
		if (path.basename(thumbnailsDirectoryPath) !== THUMBNAIL_SUBDIR) {
			res.status(400).send(`File path is not .thumbnails directory: ${thumbnailsDirectoryPath}`);
			return;
		}

		const originalParentDirectoryPath = path.dirname(thumbnailsDirectoryPath);
		const thumbnailFileName = path.basename(thumbnailFilePath.filePath);
		const thumbnailFileMatches = thumbnailFileName.match(THUMBNAIL_FILE_NAME_REGEX);

		if (!thumbnailFileMatches) {
			res.status(400).send(`Invalid thumbnail file name: ${thumbnailFileName}`);
			return;
		}

		const originalFileName = thumbnailFileMatches[1];
		const width = parseInt(thumbnailFileMatches[2]);
		const height = parseInt(thumbnailFileMatches[3]);
		// const originalFilePathChecksum = parseInt(thumbnailFileMatches[4]); // currently only for detection of original filePath changed
		const originalFilePath: IFilePath = {
			storageUnit,
			filePath: path.join(originalParentDirectoryPath, originalFileName),
		};

		if (!await this.fileSystem.exists(originalFilePath)) {
			res.status(400).send(`Original file path doesn't exist: ${originalFilePath.filePath}`);
			return;
		}

		try {
			await this.resizeImage(originalFilePath, thumbnailFilePath, { width, height });
		} catch (error) {
			res.status(500).send();
			throw error;
		}

		this.pipeFileToResponse(thumbnailAbsolutePath, res);
	}

	private async resizeImage(
		originalFilePath: IFilePath,
		thumbnailFilePath: IFilePath,
		resolutions: { width: number; height: number },
	) {
		const thumbnailParentDirectoryPath = this.fileSystem.getParentDirectoryFilePath(thumbnailFilePath);
		await this.fileSystem.ensureDirectory(thumbnailParentDirectoryPath);

		const thumbnailAbsolutePath = this.fileSystem.getAbsolutePath(thumbnailFilePath);
		const originalAbsolutePath = this.fileSystem.getAbsolutePath(originalFilePath);

		const sharpOptions: sharp.ResizeOptions = {
			fit: 'contain',
		};

		await sharp(originalAbsolutePath).resize(resolutions.width, resolutions.height, sharpOptions).toFile(thumbnailAbsolutePath);
	}

	private pipeFileToResponse(thumbnailAbsolutePath: string, res: express.Response) {
		try {
			const fileReadStream = fs.createReadStream(thumbnailAbsolutePath);
			res.status(200);
			fileReadStream.pipe(res);
		} catch (error) {
			res.status(500).send();
			throw error;
		}
	}

	private getThumbnailFilePath(filePath: IFilePath, width: string | number, height: string | number, lastModifiedAt: number) {
		const parentDirectoryPath = path.dirname(filePath.filePath);
		const filePathChecksum = this.getFilePathChecksum(filePath, lastModifiedAt);
		const thumbnailFileName = this.getThumbnailFileName(filePath, width, height, filePathChecksum);
		const thumbnailFilePath = path.join(parentDirectoryPath, THUMBNAIL_SUBDIR, thumbnailFileName);
		return {
			...filePath,
			filePath: thumbnailFilePath,
		};
	}

	private getThumbnailFileName(filePath: IFilePath, width: string | number, height: string | number, filePathChecksum: string) {
		const fileName = `${path.basename(filePath.filePath)}_image_${width}x${height}_${filePathChecksum}`;
		return fileName;
	}

	private getFilePathChecksum(filePath: IFilePath, lastModifiedAt: number) {
		const fileName = path.basename(filePath.filePath) + '_' + lastModifiedAt;
		return crypto.createHash('md5').update(fileName).digest('hex');
	}
}
