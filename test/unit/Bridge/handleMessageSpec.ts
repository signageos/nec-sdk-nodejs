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
	CopyFile,
	MoveFile,
	WriteFile,
	GetFileDetails,
	GetFileChecksum,
	ExtractFile,
	CreateDirectory,
	IsDirectory,
	ListStorageUnits,
} from '../../../src/Bridge/bridgeFileSystemMessages';
import * as PowerMessages from '../../../src/Bridge/bridgePowerMessages';
import TimerType from '@signageos/front-display/es6/NativeDevice/Timer/TimerType';
import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';

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
		const result = await handleMessage(
			{} as any, {} as any, nativeDriver as any, {} as any, {} as any, { type: GetDeviceUid } as GetDeviceUid,
		);
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
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
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
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
			type: FileExists,
			filePath: getFilePath('file1'),
		});
		result.should.deepEqual({ exists: true });
	});

	it('should process DownloadFile message', async function () {
		const downloadFile = sinon.stub().resolves();
		const fileSystem = { downloadFile };
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
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
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
			type: DeleteFile,
			filePath: getFilePath('file1'),
			recursive: false,
		});
		result.should.deepEqual({});
		deleteFile.callCount.should.equal(1);
	});

	it('should process CopyFile message', async function () {
		const copyFile = sinon.stub().resolves();
		const fileSystem = { copyFile };
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
			type: CopyFile,
			sourceFilePath: getFilePath('source'),
			destinationFilePath: getFilePath('destination'),
		});
		result.should.deepEqual({});
		copyFile.callCount.should.equal(1);
	});

	it('should process MoveFile message', async function () {
		const moveFile = sinon.stub().resolves();
		const fileSystem = { moveFile };
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
			type: MoveFile,
			sourceFilePath: getFilePath('source'),
			destinationFilePath: getFilePath('destination'),
		});
		result.should.deepEqual({});
		moveFile.callCount.should.equal(1);
	});

	it('should process WriteFile message', async function () {
		const writeFile = sinon.stub().resolves();
		const fileSystem = { writeFile };
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
			type: WriteFile,
			filePath: getFilePath('source'),
			contents: 'Some text content',
		});
		result.should.deepEqual({});
		writeFile.callCount.should.equal(1);
	});

	it('should process GetFileDetails message', async function () {
		const fileSystem = {
			getFileChecksum: async () => 'result_checksum',
		};
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
			type: GetFileChecksum,
			filePath: getFilePath('file'),
			hashType: 'md5' as any,
		});
		result.should.deepEqual({ checksum: 'result_checksum' });
	});

	it('should process GetFileChecksum message', async function () {
		const fileDetailsProvider = {
			getFileDetails: async () => ({
				createdAt: new Date(2018, 30, 11, 18, 30).valueOf(),
				lastModifiedAt: new Date(2019, 1, 0, 14).valueOf(),
				sizeBytes: 50,
				mimeType: 'video/mp4',
				videoDuration: 3000,
			}),
		};
		const result = await handleMessage({} as any, fileDetailsProvider as any, {} as any, {} as any, {} as any, {
			type: GetFileDetails,
			filePath: getFilePath('file'),
		});
		result.should.deepEqual({
			fileDetails: {
				createdAt: new Date(2018, 30, 11, 18, 30).valueOf(),
				lastModifiedAt: new Date(2019, 1, 0, 14).valueOf(),
				sizeBytes: 50,
				mimeType: 'video/mp4',
				videoDuration: 3000,
			},
		});
	});

	it('should process ExtractFile message', async function () {
		const extractFile = sinon.stub().resolves();
		const fileSystem = { extractFile };
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
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
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
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
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
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
		const result = await handleMessage(fileSystem as any, {} as any, {} as any, {} as any, {} as any, {
			type: ListStorageUnits,
		});
		result.should.deepEqual({ storageUnits });
	});

	it('should set timer', async function() {
		const nativeDriver = {
			setTimer: sinon.stub().resolves(),
		};
		await handleMessage({} as any, {} as any, nativeDriver as any, {} as any, {} as any, {
			type: PowerMessages.SetTimer,
			timerType: TimerType.TIMER_3,
			timeOn: '08:00:00',
			timeOff: '20:00:00',
			weekdays: [TimerWeekday.wed, TimerWeekday.thu],
			volume: 50,
		});
		await handleMessage({} as any, {} as any, nativeDriver as any, {} as any, {} as any, {
			type: PowerMessages.SetTimer,
			timerType: TimerType.TIMER_4,
			timeOn: '10:30:00',
			timeOff: null,
			weekdays: [TimerWeekday.mon],
			volume: 70,
		});
		await handleMessage({} as any, {} as any, nativeDriver as any, {} as any, {} as any, {
			type: PowerMessages.SetTimer,
			timerType: TimerType.TIMER_5,
			timeOn: null,
			timeOff: '22:00:00',
			weekdays: [TimerWeekday.tue, TimerWeekday.wed, TimerWeekday.thu, TimerWeekday.fri],
			volume: 100,
		});
		nativeDriver.setTimer.callCount.should.equal(3);
		nativeDriver.setTimer.getCall(0).args.should.deepEqual([
			TimerType.TIMER_3,
			'08:00:00',
			'20:00:00',
			[TimerWeekday.wed, TimerWeekday.thu],
			50,
		]);
		nativeDriver.setTimer.getCall(1).args.should.deepEqual([
			TimerType.TIMER_4,
			'10:30:00',
			null,
			[TimerWeekday.mon],
			70,
		]);
		nativeDriver.setTimer.getCall(2).args.should.deepEqual([
			TimerType.TIMER_5,
			null,
			'22:00:00',
			[TimerWeekday.tue, TimerWeekday.wed, TimerWeekday.thu, TimerWeekday.fri],
			100,
		]);
	});
});
