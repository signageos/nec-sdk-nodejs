import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { IExtendedFileDetails, IFileDetails, IVideoFileDetails } from './IFileDetails';
import IFileSystem from './IFileSystem';
import { IVideoAPI } from '../API/VideoAPI';
import IFileDetailsProvider from './IFileDetailsProvider';
import IFileMetadataCache from './IFileMetadataCache';

export default class FileDetailsProvider implements IFileDetailsProvider {

	constructor(
		private fileSystem: IFileSystem,
		private videoAPI: IVideoAPI,
		private metadataCache: IFileMetadataCache,
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
		try {
			return await this.metadataCache.getFileMetadata(filePath, lastModifiedAt);
		} catch (error) {
			const metadata = await this.getExtendedFileDetailsByMimeType(filePath, mimeType);
			if (metadata === null) {
				return null;
			}
			await this.cacheFileMetadataIfPossible(filePath, lastModifiedAt, metadata);
			return metadata;
		}
	}

	private async getExtendedFileDetailsByMimeType(filePath: IFilePath, mimeType: string): Promise<IExtendedFileDetails | null> {
		if (this.isVideo(mimeType)) {
			const fileAbsolutePath = this.fileSystem.getAbsolutePath(filePath);
			const videoDurationMs = await this.videoAPI.getVideoDurationMs(fileAbsolutePath);
			return {
				videoDurationMs,
			} as IVideoFileDetails;
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
}
