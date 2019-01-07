import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { IFileDetails, IVideoFileDetails } from './IFileDetails';
import IFileSystem from './IFileSystem';
import { IVideoAPI } from '../API/VideoAPI';
import IFileDetailsProvider from './IFileDetailsProvider';

export default class FileDetailsProvider implements IFileDetailsProvider {

	constructor(
		private fileSystem: IFileSystem,
		private videoAPI: IVideoAPI,
	) {}

	public async getFileDetails(filePath: IFilePath): Promise<IFileDetails> {
		const basicFileDetails = await this.fileSystem.getFileDetails(filePath);
		if (basicFileDetails.mimeType && this.isVideo(basicFileDetails.mimeType)) {
			try {
				const fileAbsolutePath = this.fileSystem.getAbsolutePath(filePath);
				const videoDurationMs = await this.videoAPI.getVideoDurationMs(fileAbsolutePath);
				return {
					...basicFileDetails,
					videoDurationMs,
				} as IVideoFileDetails;
			} catch (error) {
				console.warn('Get video duration failed', error);
			}
		}
		return basicFileDetails;
	}

	private isVideo(mimeType: string) {
		return mimeType.startsWith('video/');
	}
}
