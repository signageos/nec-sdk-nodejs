import * as should from 'should';
import FileSystem from "../../../../src/FileSystem/FileSystem";
import { IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { ISystemAPI } from '../../../../src/API/SystemAPI';
import ThumbnailRequestHandler from '../../../../src/FileSystem/Thumbnail/ThumbnailRequestHandler';
import VideoThumbnailExtractor from '../../../../src/FileSystem/Video/VideoThumbnailExtractor';

describe('FileSystem.Video.VideoThumbnailExtractor', function () {

	describe('getVideoThumbnailUriTemplate', function () {

		const lastModifiedAt = 1574858888870;

		const imageResizer = {} as any;
		const videoAPI = {} as any;
		const fileSystem = new FileSystem('/base/directory', '/tmp', '/app', 'SIGUSR2', {} as ISystemAPI);
		const thumbnailRequestHandler = new ThumbnailRequestHandler('http://example.com', { get: () => undefined } as any, fileSystem);
		const videoThumbnailExtractor = new VideoThumbnailExtractor(thumbnailRequestHandler, imageResizer, videoAPI);

		const filePaths = [
			{
				filePath: 'file1.mp4',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/.thumbnails/file1.mp4_video_{width}x{height}_60aeced189aeb1ec70fae65040cc215c',
			},
			{
				filePath: 'dir1/file1.mp4',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/dir1/.thumbnails/file1.mp4_video_{width}x{height}_60aeced189aeb1ec70fae65040cc215c',
			},
			{
				filePath: 'dir2/dir1/file1.mp4',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/dir2/dir1/.thumbnails/file1.mp4_video_{width}x{height}_60aeced189aeb1ec70fae65040cc215c',
			},
			{
				filePath: 'dir2/dir1/file1.mp4',
				storageUnit: { type: 'usb1', removable: true } as IStorageUnit,
				expected: 'http://example.com/external/usb1/dir2/dir1/.thumbnails/file1.mp4_video_{width}x{height}_60aeced189aeb1ec70fae65040cc215c',
			},
			{
				filePath: 'di r2/di r1/file1.mp4',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/di%20r2/di%20r1/.thumbnails/file1.mp4_video_{width}x{height}_60aeced189aeb1ec70fae65040cc215c',
			},
		];

		filePaths.forEach(({ filePath, storageUnit, expected }: (typeof filePaths)[0]) => {
			it(`should return thumbnail uri template: ${filePath}`, async function () {
				should(videoThumbnailExtractor.getVideoThumbnailUriTemplate({ storageUnit, filePath }, lastModifiedAt)).equal(expected);
			});
		});
	});
});
