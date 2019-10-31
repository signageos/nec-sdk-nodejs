import * as should from 'should';
import ImageResizer from "../../../../src/FileSystem/Image/ImageResizer";
import FileSystem from "../../../../src/FileSystem/FileSystem";
import { IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { ISystemAPI } from '../../../../src/API/SystemAPI';

describe('FileSystem.Image.ImageResizer', function () {

	describe('getImageThumbnailUriTemplate', function () {

		const fileSystem = new FileSystem('/base/directory', '/tmp', '/app', 'SIGUSR2', {} as ISystemAPI);
		const imageResizer = new ImageResizer('http://example.com', { get: () => undefined } as any, fileSystem);

		const filePaths = [
			{
				filePath: 'file1.png',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/.thumbnails/file1.png_{width}x{height}',
			},
			{
				filePath: 'dir1/file1.png',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/dir1/.thumbnails/file1.png_{width}x{height}',
			},
			{
				filePath: 'dir2/dir1/file1.jpg',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/dir2/dir1/.thumbnails/file1.jpg_{width}x{height}',
			},
			{
				filePath: 'dir2/dir1/file1.jpg',
				storageUnit: { type: 'usb1', removable: true } as IStorageUnit,
				expected: 'http://example.com/external/usb1/dir2/dir1/.thumbnails/file1.jpg_{width}x{height}',
			},
			{
				filePath: 'di r2/di r1/file1.jpg',
				storageUnit: { type: 'internal' } as IStorageUnit,
				expected: 'http://example.com/internal/di%20r2/di%20r1/.thumbnails/file1.jpg_{width}x{height}',
			},
		];

		filePaths.forEach(({ filePath, storageUnit, expected }: (typeof filePaths)[0]) => {
			it(`should return thumbnail uri template: ${filePath}`, async function () {
				should(imageResizer.getImageThumbnailUriTemplate({ storageUnit, filePath })).equal(expected);
			});
		});
	});
});
