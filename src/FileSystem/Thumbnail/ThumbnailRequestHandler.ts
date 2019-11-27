import * as path from 'path';
import * as express from 'express';
import * as crypto from "crypto";
import { IFilePath, IStorageUnit } from "@signageos/front-display/es6/NativeDevice/fileSystem";
import { EXTERNAL_STORAGE_UNITS_PATH, INTERNAL_STORAGE_UNIT } from '../IFileSystem';
import IInternalFileSystem from '../../FileSystem/IFileSystem';
import { getFileUriPath } from '../../Driver/fileSystemHelpers';
import { pipeFileToResponse } from '../helper';

export type IThumbnailProperties = {
	width: number;
	height: number;
};

// tslint:disable:max-line-length
const THUMBNAIL_SUBDIR = '.thumbnails';
const getFileNameRegexRaw = (type: string) => `([^/]+)_${type}_(\\d+)x(\\d+)_(\\w+)`;
const getFileNameRegex = (type: string) => new RegExp(getFileNameRegexRaw(type));
const getExternalRouteRegex = (type: string) => new RegExp(`^/${EXTERNAL_STORAGE_UNITS_PATH}/(\\w+)/(.*/?${THUMBNAIL_SUBDIR}/${getFileNameRegexRaw(type)})$`);
const getInternalRouteRegex = (type: string) => new RegExp(`^/(${INTERNAL_STORAGE_UNIT})/(.*/?${THUMBNAIL_SUBDIR}/${getFileNameRegexRaw(type)})$`);
// tslint:enable

export default class ThumbnailRequestHandler {

	constructor(
		private fileSystemUrl: string,
		private expressApp: express.Application,
		private fileSystem: IInternalFileSystem,
	) {}

	public getThumbnailUriTemplate(type: string, filePath: IFilePath, lastModifiedAt: number) {
		const WIDTH_PLACEHOLDER = '{width}';
		const HEIGHT_PLACEHOLDER = '{height}';
		const thumbnailFilePath = this.getThumbnailFilePath(
			type,
			filePath,
			WIDTH_PLACEHOLDER,
			HEIGHT_PLACEHOLDER,
			lastModifiedAt,
		);
		let filePathname = getFileUriPath(thumbnailFilePath);
		filePathname = filePathname.replace(encodeURI(WIDTH_PLACEHOLDER), WIDTH_PLACEHOLDER);
		filePathname = filePathname.replace(encodeURI(HEIGHT_PLACEHOLDER), HEIGHT_PLACEHOLDER);
		return `${this.fileSystemUrl}/${filePathname}`;
	}

	public routeThumbnail(
		type: string,
		generateThumbnailCallback: (
			originalFilePath: string,
			thumbnailFilePath: string,
			properties: IThumbnailProperties,
		) => Promise<void>,
	) {
		const externalRouteRegex = getExternalRouteRegex(type);
		this.expressApp.get(
			externalRouteRegex,
			this.handleThumbnailResponse(type, externalRouteRegex, generateThumbnailCallback),
		);

		const internalRouteRegex = getInternalRouteRegex(type);
		this.expressApp.get(
			internalRouteRegex,
			this.handleThumbnailResponse(type, internalRouteRegex, generateThumbnailCallback),
		);
	}

	public handleThumbnailResponse = (
		type: string,
		routeRegex: RegExp,
		generateThumbnailCallback: (
			originalFilePath: string,
			thumbnailFilePath: string,
			properties: IThumbnailProperties,
		) => Promise<void>,
	) => async (
		req: express.Request,
		res: express.Response,
	) => {
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
			pipeFileToResponse(thumbnailAbsolutePath, res);
			return;
		}

		const thumbnailsDirectoryPath = path.dirname(thumbnailFilePath.filePath);
		if (path.basename(thumbnailsDirectoryPath) !== THUMBNAIL_SUBDIR) {
			res.status(400).send(`File path is not .thumbnails directory: ${thumbnailsDirectoryPath}`);
			return;
		}

		const originalParentDirectoryPath = path.dirname(thumbnailsDirectoryPath);
		const thumbnailFileName = path.basename(thumbnailFilePath.filePath);
		const thumbnailFileMatches = thumbnailFileName.match(getFileNameRegex(type));

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
		const originalAbsolutePath = this.fileSystem.getAbsolutePath(originalFilePath);

		if (!await this.fileSystem.exists(originalFilePath)) {
			res.status(400).send(`Original file path doesn't exist: ${originalFilePath.filePath}`);
			return;
		}

		try {
			const thumbnailParentDirectoryPath = this.fileSystem.getParentDirectoryFilePath(thumbnailFilePath);
			await this.fileSystem.ensureDirectory(thumbnailParentDirectoryPath);

			await generateThumbnailCallback(originalAbsolutePath, thumbnailAbsolutePath, { width, height });
		} catch (error) {
			res.status(500).send();
			throw error;
		}

		pipeFileToResponse(thumbnailAbsolutePath, res);
	}

	public getThumbnailFilePath(
		type: string,
		filePath: IFilePath,
		width: string | number,
		height: string | number,
		lastModifiedAt: number,
	) {
		const parentDirectoryPath = path.dirname(filePath.filePath);
		const filePathChecksum = this.getFilePathChecksum(filePath, lastModifiedAt);
		const thumbnailFileName = this.getThumbnailFileName(type, filePath, width, height, filePathChecksum);
		const thumbnailFilePath = path.join(parentDirectoryPath, THUMBNAIL_SUBDIR, thumbnailFileName);
		return {
			...filePath,
			filePath: thumbnailFilePath,
		};
	}

	private getThumbnailFileName(
		type: string,
		filePath: IFilePath,
		width: string | number,
		height: string | number,
		filePathChecksum: string,
	) {
		const fileName = `${path.basename(filePath.filePath)}_${type}_${width}x${height}_${filePathChecksum}`;
		return fileName;
	}

	private getFilePathChecksum(filePath: IFilePath, lastModifiedAt: number) {
		const fileName = path.basename(filePath.filePath) + '_' + lastModifiedAt;
		return crypto.createHash('md5').update(fileName).digest('hex');
	}
}
