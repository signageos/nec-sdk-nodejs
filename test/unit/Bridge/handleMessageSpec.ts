import 'should';
import * as sinon from 'sinon';
import handleMessage, { InvalidMessageError } from '../../../src/Bridge/handleMessage';
import {
	GetDeviceUid,
	FileSystemGetFiles,
	FileSystemFileExists,
	FileSystemDownloadFile,
	FileSystemDeleteFile,
} from '../../../src/Bridge/bridgeSystemMessages';

describe('Bridge.handleMessage', function () {

	it('should process GetDeviceUid message and return device uid', async function () {
		const nativeDriver = {
			getDeviceUid: sinon.stub().resolves('deviceUid1'),
		};
		const result = await handleMessage({} as any, nativeDriver as any, { type: GetDeviceUid } as GetDeviceUid);
		result.should.deepEqual({ deviceUid: 'deviceUid1' });
	});

	it('should process FileSystemGetFiles message and return map of full paths to files', async function () {
		const fileSystem = {
			getFilesInDirectory: sinon.stub().withArgs('dir1').resolves(['file1', 'file2', 'file3']),
			getFullPath: sinon.stub().withArgs('dir1').returns('/absolute/path/dir1'),
		};
		const result = await handleMessage(fileSystem as any, {} as any, { type: FileSystemGetFiles, path: 'dir1' } as FileSystemGetFiles);
		result.should.deepEqual({ files: ['file1', 'file2', 'file3'] });
	});

	it('should process FileSystemFileExists message and return true if the file exists or false if it doesn\'t', async function () {
		const fileSystem = {
			pathExists: sinon.stub().callsFake(async (path: string) => {
				switch (path) {
					case 'file1': return true;
					case 'file2': return true;
					case 'file3': return false;
					default: throw new Error('invalid path:' + path);
				}
			}),
			isFile: sinon.stub().callsFake(async (path: string) => {
				switch (path) {
					case 'file1': return true;
					case 'file2': return false;
					case 'file3': return true;
					default: throw new Error('invalid path:' + path);
				}
			})
		};

		const result1 = await handleMessage(
			fileSystem as any,
			{} as any,
			{ type: FileSystemFileExists, path: 'file1' } as FileSystemFileExists,
		);
		result1.should.deepEqual({ fileExists: true });

		const result2 = await handleMessage(
			fileSystem as any,
			{} as any,
			{ type: FileSystemFileExists, path: 'file2' } as FileSystemFileExists,
		);
		result2.should.deepEqual({ fileExists: false });

		const result3 = await handleMessage(
			fileSystem as any,
			{} as any,
			{ type: FileSystemFileExists, path: 'file3' } as FileSystemFileExists,
		);
		result3.should.deepEqual({ fileExists: false });
	});

	it('should process FileSystemDownloadFile message', async function () {
		const fileSystem = {
			downloadFile: sinon.spy(),
		};
		await handleMessage(
			fileSystem as any,
			{} as any,
			{
				type: FileSystemDownloadFile,
				path: 'destination',
				uri: 'http://some_url.test',
				headers: { header1: 'value1', header2: 'value2' },
			} as FileSystemDownloadFile,
		);
		fileSystem.downloadFile.callCount.should.equal(1);
		fileSystem.downloadFile.getCall(0).args[0].should.equal('destination');
		fileSystem.downloadFile.getCall(0).args[1].should.equal('http://some_url.test');
		fileSystem.downloadFile.getCall(0).args[2].should.deepEqual({ header1: 'value1', header2: 'value2' });
	});

	it('should process FileSystemDeleteFile message', async function () {
		const fileSystem = {
			deleteFile: sinon.spy(),
		};
		await handleMessage(fileSystem as any, {} as any, { type: FileSystemDeleteFile, path: 'file1' } as FileSystemDeleteFile);
		fileSystem.deleteFile.callCount.should.equal(1);
		fileSystem.deleteFile.getCall(0).args[0].should.equal('file1');
	});

	it('should throw InvalidMessageError exception for invalid message', async function () {
		const fileSystem = {} as any;
		await handleMessage(fileSystem, {} as any, {} as any).should.be.rejectedWith(InvalidMessageError);
	});
});
