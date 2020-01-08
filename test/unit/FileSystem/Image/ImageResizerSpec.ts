import * as should from 'should';
import ImageResizer from "../../../../src/FileSystem/Image/ImageResizer";
import FileSystem from "../../../../src/FileSystem/FileSystem";
import { IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { ISystemAPI } from '../../../../src/API/SystemAPI';
import ThumbnailRequestHandler from '../../../../src/FileSystem/Thumbnail/ThumbnailRequestHandler';

describe('FileSystem.Image.ImageResizer', function () {

	describe('getImageThumbnailUriTemplate', function () {

		const lastModifiedAt = 1574858888870;

		const fileSystem = new FileSystem('/base/directory', '/tmp', '/app', 'SIGUSR2', {} as ISystemAPI);
		const thumbnailRequestHandler = new ThumbnailRequestHandler('http://example.com', { get: () => undefined } as any, fileSystem);
		const imageResizer = new ImageResizer(thumbnailRequestHandler);

		const filePaths = [
			{
				filePath: 'file1.png',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/.thumbnails/file1.png_image_{width}x{height}_83ff61ec25401c2ab87242c659f678f5',
			},
			{
				filePath: 'dir1/file1.png',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/dir1/.thumbnails/file1.png_image_{width}x{height}_83ff61ec25401c2ab87242c659f678f5',
			},
			{
				filePath: 'dir2/dir1/file1.jpg',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/dir2/dir1/.thumbnails/file1.jpg_image_{width}x{height}_9610ede8cfa5bb150aa8d3b36cd0a85f',
			},
			{
				filePath: 'dir2/dir1/file1.jpg',
				storageUnit: { type: 'usb1', removable: true } as IStorageUnit,
				expected: 'http://example.com/external/usb1/dir2/dir1/.thumbnails/file1.jpg_image_{width}x{height}_9610ede8cfa5bb150aa8d3b36cd0a85f',
			},
			{
				filePath: 'di r2/di r1/file1.jpg',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/di%20r2/di%20r1/.thumbnails/file1.jpg_image_{width}x{height}_9610ede8cfa5bb150aa8d3b36cd0a85f',
			},
		];

		filePaths.forEach(({ filePath, storageUnit, expected }: (typeof filePaths)[0]) => {
			it(`should return thumbnail uri template: ${filePath}`, async function () {
				should(imageResizer.getImageThumbnailUriTemplate({ storageUnit, filePath }, lastModifiedAt)).equal(expected);
			});
		});
	});
});