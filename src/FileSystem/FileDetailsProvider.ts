import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { IExtendedFileDetails, IFileDetails, IVideoFileDetails, IImageFileDetails } from './IFileDetails';
import IFileSystem from './IFileSystem';
import { IVideoAPI } from '../API/VideoAPI';
import IFileDetailsProvider from './IFileDetailsProvider';
import IFileMetadataCache from './IFileMetadataCache';
import ImageResizer from './Image/ImageResizer';
import VideoThumbnailExtractor from './Video/VideoThumbnailExtractor';

export default class FileDetailsProvider implements IFileDetailsProvider {

	constructor(
		private fileSystem: IFileSystem,
		private videoAPI: IVideoAPI,
		private metadataCache: IFileMetadataCache,
		private imageResizer: ImageResizer,
		private videoThumbnailExtractor: VideoThumbnailExtractor,
	) {}

	public async getFileDetails(filePath: IFilePath): Promise<IFileDetails & IExtendedFileDetails> {
		const basicFileDetails = await this.fileSystem.getFileDetails(filePath);
		if (basicFileDetails.mimeType) {
			try {
				const extendedFileDetails = await this.getExtendedFileDetails(
					filePath,
					basicFileDetails.lastModifiedAt,
					basicFileDetails.mimeType,
				);
				if (extendedFileDetails === null) {
					return basicFileDetails;
				}
				return {
					...basicFileDetails,
					...extendedFileDetails,
				} as IFileDetails & IVideoFileDetails;
			} catch (error) {
				console.warn('Get extended file details failed', error);
			}
		}
		return basicFileDetails;
	}

	private async getExtendedFileDetails(filePath: IFilePath, lastModifiedAt: number, mimeType: string): Promise<IExtendedFileDetails | null> {
		const extendedFileDetails = this.getExtendedFileDetailsByMimeType(filePath, lastModifiedAt, mimeType);
		const extendedFileMetadata = await this.getExtendedFileMetadataFromCacheOrCompute(filePath, lastModifiedAt, mimeType);

		if (extendedFileDetails === null && extendedFileMetadata === null) {
			return null;
		}

		return {
			...extendedFileDetails || {},
			...extendedFileMetadata || {},
		};
	}

	private getExtendedFileDetailsByMimeType(
		filePath: IFilePath,
		lastModifiedAt: number,
		mimeType: string,
	): IExtendedFileDetails | null {
		if (this.isVideo(mimeType)) {
			const videoThumbnailUriTemplate = this.videoThumbnailExtractor.getVideoThumbnailUriTemplate(filePath, lastModifiedAt);
			if (videoThumbnailUriTemplate) {
				return {
					videoThumbnailUriTemplate,
				} as IVideoFileDetails;
			}
		} else if (this.isImage(mimeType)) {
			if (this.imageResizer.getSupportedMimeTypes().indexOf(mimeType) !== -1) {
				const imageThumbnailUriTemplate = this.imageResizer.getImageThumbnailUriTemplate(filePath, lastModifiedAt);
				return {
					imageThumbnailUriTemplate,
				} as IImageFileDetails;
			}
		}
		return null;
	}

	private async getExtendedFileMetadataFromCacheOrCompute(
		filePath: IFilePath,
		lastModifiedAt: number,
		mimeType: string,
	): Promise<IExtendedFileDetails | null> {
		try {
			return await this.metadataCache.getFileMetadata(filePath, lastModifiedAt);
		} catch (error) {
			const metadata = await this.getExtendedFileMetadataByMimeType(filePath, mimeType);
			if (metadata === null) {
				return null;
			}
			await this.cacheFileMetadataIfPossible(filePath, lastModifiedAt, metadata);
			return metadata;
		}
	}

	private async getExtendedFileMetadataByMimeType(
		filePath: IFilePath,
		mimeType: string,
	): Promise<IExtendedFileDetails | null> {
		if (this.isVideo(mimeType)) {
			const extendedFileDetails: IVideoFileDetails = {};
			const fileAbsolutePath = this.fileSystem.getAbsolutePath(filePath);
			try {
				const videoDetails = await this.videoAPI.getVideoDetails(fileAbsolutePath);

				if (typeof videoDetails.width !== 'undefined' && typeof videoDetails.height !== 'undefined') {
					extendedFileDetails.videoResolution = {
						width: videoDetails.width,
						height: videoDetails.height,
					};
				} else {
					console.warn('get extended file details videoResolution failed');
				}

				if (typeof videoDetails.durationMs !== 'undefined') {
					extendedFileDetails.videoDurationMs = videoDetails.durationMs;
				} else {
					console.warn('get extended file details videoDurationMs failed');
				}

				if (typeof videoDetails.framerate !== 'undefined') {
					extendedFileDetails.videoFramerate = videoDetails.framerate;
				} else {
					console.warn('get extended file details videoFramerate failed');
				}

				if (typeof videoDetails.bitrate !== 'undefined') {
					extendedFileDetails.videoBitrate = videoDetails.bitrate;
				} else {
					console.warn('get extended file details videoBitrate failed');
				}

				if (typeof videoDetails.codec !== 'undefined') {
					extendedFileDetails.videoCodec = videoDetails.codec;
				} else {
					console.warn('get extended file details videoCodec failed');
				}
			} catch (error) {
				console.warn('get extended video details failed', error);
			}

			return extendedFileDetails;
		}

		return null;
	}

	private async cacheFileMetadataIfPossible(filePath: IFilePath, lastModifiedAt: number, metadata: IExtendedFileDetails) {
		try {
			await this.metadataCache.saveFileMetadata(filePath, lastModifiedAt, metadata);
		} catch (error) {
			console.error('Failed to cache file metadata on storage unit ' + filePath.storageUnit.type, error);
		}
	}

	private isVideo(mimeType: string) {
		return mimeType.startsWith('video/');
	}

	private isImage(mimeType: string) {
		return mimeType.startsWith('image/');
	}
}
