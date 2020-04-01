import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as child_process from 'child_process';
import { IFilePath } from "@signageos/front-display/es6/NativeDevice/fileSystem";
import ThumbnailRequestHandler, { IThumbnailProperties } from '../Thumbnail/ThumbnailRequestHandler';
import { checksumString } from '@signageos/front-display/es6/Hash/checksum';
import ImageResizer from '../Image/ImageResizer';
import { IVideoAPI } from '../../API/VideoAPI';

const FILE_TYPE = 'video';

export default class VideoThumbnailExtractor {

	constructor(
		private thumbnailRequestHandler: ThumbnailRequestHandler,
		private imageResizer: ImageResizer,
		private videoAPI: IVideoAPI,
	) {
		this.thumbnailRequestHandler.routeThumbnail(FILE_TYPE, this.generateVideoThumbnail);
	}

	public getVideoThumbnailUriTemplate(filePath: IFilePath, lastModifiedAt: number) {
		return this.thumbnailRequestHandler.getThumbnailUriTemplate(FILE_TYPE, filePath, lastModifiedAt);
	}

	private generateVideoThumbnail = async (
		originalFilePath: string,
		thumbnailFilePath: string,
		properties: IThumbnailProperties,
	) => {
		const firstFrameTime = await this.getFirstFrameTime(originalFilePath);

		const videoFramesDirPath = path.join(os.tmpdir(), 'video-frames');
		await fs.ensureDir(videoFramesDirPath);
		// Frame is kept in tmp dir until reboot
		const frameFilePath = path.join(videoFramesDirPath, checksumString(originalFilePath) + '.jpg');

		if (!await fs.pathExists(frameFilePath)) {
			await this.extractVideoFrame(originalFilePath, firstFrameTime, frameFilePath);
		}

		await this.imageResizer.generateImageThumbnail(frameFilePath, thumbnailFilePath, properties);
	}

	private extractVideoFrame(originalFilePath: string, firstFrameTime: string, frameFilePath: string) {
		return new Promise((resolve: () => void, reject: (error: Error) => void) => {
			const ffmpegProcess = child_process.spawn('ffmpeg', [
				'-i',
				originalFilePath,
				'-ss',
				firstFrameTime,
				'-vframes',
				'1',
				frameFilePath,
			]);
			ffmpegProcess.on('exit', resolve);
			ffmpegProcess.on('error', reject);
		});
	}

	private async getFirstFrameTime(originalFilePath: string) {
		try {
			const videoDetails = await this.videoAPI.getVideoDetails(originalFilePath);
			if (typeof videoDetails.durationMs !== 'undefined' && videoDetails.durationMs > 1e3) {
				return '00:00:01.000'; // take picture of first second frame
			}
		} catch (error) {
			console.warn(error);
		}

		return '00:00:00.000';
	}
}
