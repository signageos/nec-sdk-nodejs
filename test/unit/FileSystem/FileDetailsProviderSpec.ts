import * as sinon from 'sinon';
import FileDetailsProvider from '../../../src/FileSystem/FileDetailsProvider';
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { getFilePath } from './filePathHelper';

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
			const fileDetailsProvider = new FileDetailsProvider(fileSystem as any, {} as any, {} as any, {} as any);
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
			const fileDetailsProvider = new FileDetailsProvider(fileSystem as any, {} as any, {} as any, {} as any);
			const fileDetails = await fileDetailsProvider.getFileDetails(getFilePath('file1'));
			fileDetails.should.deepEqual({
				createdAt: new Date(2018, 20, 11, 15).valueOf(),
				lastModifiedAt: new Date(2018, 21, 11, 8, 30).valueOf(),
				sizeBytes: 100,
				mimeType: 'plain/text',
			});
		});

		it(
			'should return extended video details for a file of type video/mp4 and save them to metadata cache',
			async function () {
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
				const fileMetadataCache = {
					getFileMetadata: sinon.stub().rejects(),
					saveFileMetadata: sinon.stub().resolves(),
				};
				const fileDetailsProvider = new FileDetailsProvider(fileSystem as any, videoApi as any, fileMetadataCache as any, {} as any);
				const fileDetails = await fileDetailsProvider.getFileDetails(getFilePath('file1'));
				fileDetails.should.deepEqual({
					createdAt: new Date(2018, 20, 11, 15).valueOf(),
					lastModifiedAt: new Date(2018, 21, 11, 8, 30).valueOf(),
					sizeBytes: 100,
					mimeType: 'video/mp4',
					videoDurationMs: 4000,
				});
				fileMetadataCache.saveFileMetadata.callCount.should.equal(1);
				fileMetadataCache.saveFileMetadata.getCall(0).args.should.deepEqual([
					getFilePath('file1'),
					new Date(2018, 21, 11, 8, 30).valueOf(),
					{
						videoDurationMs: 4000,
					},
				]);
			},
		);

		it(
			'should successfully return extended video details for a file of type video/mp4 even when saving to cache fails',
			async function () {
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
				const fileMetadataCache = {
					getFileMetadata: sinon.stub().rejects(),
					saveFileMetadata: sinon.stub().rejects(),
				};
				const fileDetailsProvider = new FileDetailsProvider(fileSystem as any, videoApi as any, fileMetadataCache as any, {} as any);
				const fileDetails = await fileDetailsProvider.getFileDetails(getFilePath('file1'));
				fileDetails.should.deepEqual({
					createdAt: new Date(2018, 20, 11, 15).valueOf(),
					lastModifiedAt: new Date(2018, 21, 11, 8, 30).valueOf(),
					sizeBytes: 100,
					mimeType: 'video/mp4',
					videoDurationMs: 4000,
				});
				fileMetadataCache.saveFileMetadata.callCount.should.equal(1);
				fileMetadataCache.saveFileMetadata.getCall(0).args.should.deepEqual([
					getFilePath('file1'),
					new Date(2018, 21, 11, 8, 30).valueOf(),
					{
						videoDurationMs: 4000,
					},
				]);
			},
		);

		it(
			'should return extended video details for a file of type video/mp4 from metadata cache',
			async function () {
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
				const fileMetadataCache = {
					getFileMetadata: sinon.stub().resolves({
						videoDurationMs: 5000,
					}),
				};
				const fileDetailsProvider = new FileDetailsProvider(fileSystem as any, {} as any, fileMetadataCache as any, {} as any);
				const fileDetails = await fileDetailsProvider.getFileDetails(getFilePath('file1'));
				fileDetails.should.deepEqual({
					createdAt: new Date(2018, 20, 11, 15).valueOf(),
					lastModifiedAt: new Date(2018, 21, 11, 8, 30).valueOf(),
					sizeBytes: 100,
					mimeType: 'video/mp4',
					videoDurationMs: 5000,
				});
			},
		);
	});
});
