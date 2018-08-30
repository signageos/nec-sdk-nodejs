import 'should';
import * as sinon from 'sinon';
import handleMessage, { InvalidMessageError } from '../../../src/Bridge/handleMessage';
import {
	GetDeviceUid,
	FileSystemGetFiles,
	FileSystemGetFile,
	FileSystemDownloadFile,
	FileSystemDeleteFile,
} from '../../../src/Bridge/bridgeMessages';

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
		result.should.deepEqual({
			files: {
				file1: '/absolute/path/dir1/file1',
				file2: '/absolute/path/dir1/file2',
				file3: '/absolute/path/dir1/file3',
			},
		});
	});

	it('should process FileSystemGetFile message and return full path to file', async function () {
		const fileSystem = {
			getFullPath: sinon.stub().withArgs('file1').returns('/absolute/path/file1'),
		};
		const result = await handleMessage(fileSystem as any, {} as any, { type: FileSystemGetFile, path: 'file1' } as FileSystemGetFile);
		result.should.deepEqual({ file: '/absolute/path/file1' });
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
