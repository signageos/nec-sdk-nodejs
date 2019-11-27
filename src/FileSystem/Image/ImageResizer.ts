import * as sharp from 'sharp';
import { IFilePath } from "@signageos/front-display/es6/NativeDevice/fileSystem";
import ThumbnailRequestHandler, { IThumbnailProperties } from '../Thumbnail/ThumbnailRequestHandler';

const FILE_TYPE = 'image';

export default class ImageResizer {

	constructor(
		private thumbnailRequestHandler: ThumbnailRequestHandler,
	) {
		this.thumbnailRequestHandler.routeThumbnail(FILE_TYPE, this.generateImageThumbnail);
	}

	public getSupportedMimeTypes() {
		return [
			'image/jpeg',
			'image/png',
			'image/webp',
			'image/tiff',
		];
	}

	public getImageThumbnailUriTemplate(filePath: IFilePath, lastModifiedAt: number) {
		return this.thumbnailRequestHandler.getThumbnailUriTemplate(FILE_TYPE, filePath, lastModifiedAt);
	}

	private generateImageThumbnail = async (
		originalAbsolutePath: string,
		thumbnailAbsolutePath: string,
		resolutions: IThumbnailProperties,
	) => {
		const sharpOptions: sharp.ResizeOptions = {
			fit: 'contain',
		};

		await sharp(originalAbsolutePath).resize(resolutions.width, resolutions.height, sharpOptions).toFile(thumbnailAbsolutePath);
	}
}
