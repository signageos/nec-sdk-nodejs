import 'should';
import * as sinon from 'sinon';
import { IFilePath, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import handleMessage from '../../../src/Bridge/handleMessage';
import {
	GetDeviceUid,
} from '../../../src/Bridge/bridgeSystemMessages';
import {
	ListFiles,
	FileExists,
	DownloadFile,
	DeleteFile,
	MoveFile,
	GetFileChecksum,
	ExtractFile,
	CreateDirectory,
	IsDirectory,
	ListStorageUnits,
} from '../../../src/Bridge/bridgeFileSystemMessages';

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

describe('Bridge.handleMessage', function () {

	it('should process GetDeviceUid message and return device uid', async function () {
		const nativeDriver = {
			getDeviceUid: sinon.stub().resolves('deviceUid1'),
		};
		const result = await handleMessage({} as any, nativeDriver as any, { type: GetDeviceUid } as GetDeviceUid);
		result.should.deepEqual({ deviceUid: 'deviceUid1' });
	});

	it('should process ListFiles message', async function () {
		const fileSystem = {
			listFiles: sinon.stub().resolves([
				getFilePath('directory/file1'),
				getFilePath('directory/file2'),
				getFilePath('directory/file3'),
			]),
		};
		const result = await handleMessage(fileSystem as any, {} as any, {
			type: ListFiles,
			directoryPath: getFilePath('directory'),
		});
		result.should.deepEqual({
			files: [
				getFilePath('directory/file1'),
				getFilePath('directory/file2'),
				getFilePath('directory/file3'),
			],
		});
	});

	it('should process FileExists message', async function () {
		const fileSystem = {
			exists: sinon.stub().resolves(true),
		};
		const result = await handleMessage(fileSystem as any, {} as any, {
			type: FileExists,
			filePath: getFilePath('file1'),
		});
		result.should.deepEqual({ exists: true });
	});

	it('should process DownloadFile message', async function () {
		const downloadFile = sinon.stub().resolves();
		const fileSystem = { downloadFile };
		const result = await handleMessage(fileSystem as any, {} as any, {
			type: DownloadFile,
			filePath: getFilePath('file1'),
			sourceUri: 'uri1',
		});
		result.should.deepEqual({});
		downloadFile.callCount.should.equal(1);
	});

	it('should process DeleteFile message', async function () {
		const deleteFile = sinon.stub().resolves();
		const fileSystem = { deleteFile };
		const result = await handleMessage(fileSystem as any, {} as any, {
			type: DeleteFile,
			filePath: getFilePath('file1'),
			recursive: false,
		});
		result.should.deepEqual({});
		deleteFile.callCount.should.equal(1);
	});

	it('should process MoveFile message', async function () {
		const moveFile = sinon.stub().resolves();
		const fileSystem = { moveFile };
		const result = await handleMessage(fileSystem as any, {} as any, {
			type: MoveFile,
			sourceFilePath: getFilePath('source'),
			destinationFilePath: getFilePath('destination'),
		});
		result.should.deepEqual({});
		moveFile.callCount.should.equal(1);
	});

	it('should process GetFileChecksum message', async function () {
		const fileSystem = {
			getFileChecksum: async () => 'result_checksum',
		};
		const result = await handleMessage(fileSystem as any, {} as any, {
			type: GetFileChecksum,
			filePath: getFilePath('file'),
			hashType: 'md5' as any,
		});
		result.should.deepEqual({ checksum: 'result_checksum' });
	});

	it('should process ExtractFile message', async function () {
		const extractFile = sinon.stub().resolves();
		const fileSystem = { extractFile };
		const result = await handleMessage(fileSystem as any, {} as any, {
			type: ExtractFile,
			archiveFilePath: getFilePath('archive.zip'),
			destinationDirectoryPath: getFilePath('destination'),
			method: 'zip',
		});
		result.should.deepEqual({});
		extractFile.callCount.should.equal(1);
	});

	it('should process CreateDirectory message', async function () {
		const createDirectory = sinon.stub().resolves();
		const fileSystem = { createDirectory };
		const result = await handleMessage(fileSystem as any, {} as any, {
			type: CreateDirectory,
			directoryPath: getFilePath('directory'),
		});
		result.should.deepEqual({});
		createDirectory.callCount.should.equal(1);
	});

	it('should process IsDirectory message', async function () {
		const fileSystem = {
			isDirectory: async () => true,
		};
		const result = await handleMessage(fileSystem as any, {} as any, {
			type: IsDirectory,
			filePath: getFilePath('directory'),
		});
		result.should.deepEqual({ isDirectory: true });
	});

	it('should process ListStorageUnits', async function () {
		const storageUnits = [
			{
				type: 'first',
				capacity: 100,
				freeSpace: 60,
				usableSpace: 60,
				removable: false,
			},
			{
				type: 'second',
				capacity: 150,
				freeSpace: 90,
				usableSpace: 90,
				removable: true,
			},
		];
		const fileSystem = {
			listStorageUnits: async () => storageUnits,
		};
		const result = await handleMessage(fileSystem as any, {} as any, {
			type: ListStorageUnits,
		});
		result.should.deepEqual({ storageUnits });
	});
});
