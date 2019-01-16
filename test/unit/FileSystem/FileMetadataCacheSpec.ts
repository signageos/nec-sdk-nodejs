import * as sinon from 'sinon';
import FileMetadataCache from '../../../src/FileSystem/FileMetadataCache';
import { getFilePath } from './filePathHelper';

describe('FileSystem.FileMetadataCache', function () {

	describe('getFileMetadata', function () {

		it('should return video metadata object', async function () {
			const metadataFileContents = 'vd:3000';
			const fileSystem = {
				readFile: sinon.stub().resolves(metadataFileContents),
			};
			const fileMetadataCache = new FileMetadataCache(fileSystem as any);
			const filePath = 'test/file1';
			const lastModifiedAt = 1594418400000;
			const metadata = await fileMetadataCache.getFileMetadata(getFilePath(filePath), lastModifiedAt);
			metadata.should.deepEqual({
				videoDurationMs: 3000,
			});

			const metadataFileName = '74a4f2a564a174ccb5f9b234e58b4c42';
			const metadataFilePath = getFilePath('test/.metadata/' + metadataFileName);
			fileSystem.readFile.callCount.should.equal(1);
			fileSystem.readFile.getCall(0).args[0].should.deepEqual(metadataFilePath);
		});

		it('should reject if metadata file doesn\'t exist', async function () {
			const fileSystem = {
				readFile: sinon.stub().rejects(),
			};
			const fileMetadataCache = new FileMetadataCache(fileSystem as any);
			const filePath = 'test/file1';
			const lastModifiedAt = 1594418400000;
			await fileMetadataCache.getFileMetadata(getFilePath(filePath), lastModifiedAt).should.be.rejected();
		});
	});

	describe('saveFileMetadata', function () {

		it('should ensure metadata directory and save metadata to a file', async function () {
			const fileSystem = {
				saveToFile: sinon.stub().resolves(),
				ensureDirectory: sinon.stub().resolves(),
			};
			const fileMetadataCache = new FileMetadataCache(fileSystem as any);
			const filePath = 'test/subdir/file2';
			const lastModifiedAt = 1546383600000;
			const metadata = {
				videoDurationMs: 12345,
			};
			await fileMetadataCache.saveFileMetadata(getFilePath(filePath), lastModifiedAt, metadata);

			const metadataFileName = '2e16150741f644be708b2f1432629c6d';
			const metadataFilePath = getFilePath('test/subdir/.metadata/' + metadataFileName);
			fileSystem.ensureDirectory.callCount.should.equal(1);
			fileSystem.ensureDirectory.getCall(0).args.should.deepEqual([
				getFilePath('test/subdir/.metadata'),
			]);
			fileSystem.saveToFile.callCount.should.equal(1);
			fileSystem.saveToFile.getCall(0).args.should.deepEqual([
				metadataFilePath,
				'vd:12345',
			]);
		});

		it('should do nothing if the metadata object is empty', async function () {
			const fileSystem = {
				saveToFile: sinon.stub().resolves(),
			};
			const fileMetadataCache = new FileMetadataCache(fileSystem as any);
			const filePath = 'test/subdir/file2';
			const lastModifiedAt = 1546383600000;
			const metadata = {};
			await fileMetadataCache.saveFileMetadata(getFilePath(filePath), lastModifiedAt, metadata);
			fileSystem.saveToFile.callCount.should.equal(0);
		});
	});
});
