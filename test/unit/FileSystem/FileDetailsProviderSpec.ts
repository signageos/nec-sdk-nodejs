import FileDetailsProvider from '../../../src/FileSystem/FileDetailsProvider';
import { IFilePath, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';

const testStorageUnit = {
	type: 'test',
	capacity: 0,
	freeSpace: 0,
	usableSpace: 0,
	removable: false,
} as IStorageUnit;

function getFilePath(filePath: string): IFilePath {
	return {
		storageUnit: testStorageUnit,
		filePath,
	};
}

describe('FileSystem.FileDetailsProvider', function () {

	describe('getFileDetails', function () {

		it('should return basic details for a file without a mime type', async function () {
			const fileSystem = {
				async getFileDetails() {
					return {
						createdAt: new Date(2018, 20, 11, 15).valueOf(),
						lastModifiedAt: new Date(2018, 21, 11, 8, 30).valueOf(),
						sizeBytes: 100,
					};
				},
			};
			const fileDetailsProvider = new FileDetailsProvider(fileSystem as any, {} as any);
			const fileDetails = await fileDetailsProvider.getFileDetails(getFilePath('file1'));
			fileDetails.should.deepEqual({
				createdAt: new Date(2018, 20, 11, 15).valueOf(),
				lastModifiedAt: new Date(2018, 21, 11, 8, 30).valueOf(),
				sizeBytes: 100,
			});
		});

		it('should return basic details for a file of type plain/text', async function () {
			const fileSystem = {
				async getFileDetails() {
					return {
						createdAt: new Date(2018, 20, 11, 15).valueOf(),
						lastModifiedAt: new Date(2018, 21, 11, 8, 30).valueOf(),
						sizeBytes: 100,
						mimeType: 'plain/text',
					};
				},
			};
			const fileDetailsProvider = new FileDetailsProvider(fileSystem as any, {} as any);
			const fileDetails = await fileDetailsProvider.getFileDetails(getFilePath('file1'));
			fileDetails.should.deepEqual({
				createdAt: new Date(2018, 20, 11, 15).valueOf(),
				lastModifiedAt: new Date(2018, 21, 11, 8, 30).valueOf(),
				sizeBytes: 100,
				mimeType: 'plain/text',
			});
		});

		it('should return extended video details for a file of type video/mp4', async function () {
			const fileSystem = {
				async getFileDetails() {
					return {
						createdAt: new Date(2018, 20, 11, 15).valueOf(),
						lastModifiedAt: new Date(2018, 21, 11, 8, 30).valueOf(),
						sizeBytes: 100,
						mimeType: 'video/mp4',
					};
				},
				getAbsolutePath(filePath: IFilePath) {
					return filePath.filePath;
				},
			};
			const videoApi = {
				async getVideoDurationMs() {
					return 4000;
				},
			};
			const fileDetailsProvider = new FileDetailsProvider(fileSystem as any, videoApi as any);
			const fileDetails = await fileDetailsProvider.getFileDetails(getFilePath('file1'));
			fileDetails.should.deepEqual({
				createdAt: new Date(2018, 20, 11, 15).valueOf(),
				lastModifiedAt: new Date(2018, 21, 11, 8, 30).valueOf(),
				sizeBytes: 100,
				mimeType: 'video/mp4',
				videoDurationMs: 4000,
			});
		});
	});
});
