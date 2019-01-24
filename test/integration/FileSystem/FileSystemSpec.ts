import * as fs from 'fs-extra';
import * as should from 'should';
import { promisify } from 'util';
import * as child_process from 'child_process';
import * as path from 'path';
import * as http from 'http';
import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as multer from 'multer';
import { IFilePath, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { FileOrDirectoryNotFound } from '../../../src/FileSystem/IFileSystem';
import FileSystem from '../../../src/FileSystem/FileSystem';

const parameters = require('../../../config/parameters');
const fileSystemRoot = parameters.fileSystem.root;
const tmpFileSystemRoot = parameters.fileSystem.tmp;

const testStorageUnit = {
	type: 'test',
	capacity: 0,
	freeSpace: 0,
	usableSpace: 0,
	removable: false,
} as IStorageUnit;

function createFileSystem() {
	return new FileSystem(fileSystemRoot, tmpFileSystemRoot, 'SIGUSR2');
}

function getRootPath() {
	return path.join(fileSystemRoot, 'test');
}

function getAbsolutePath(relativePath: string) {
	const rootPath = getRootPath();
	return path.join(rootPath, relativePath);
}

function getFilePathObject(filePath: string): IFilePath {
	return {
		storageUnit: testStorageUnit,
		filePath,
	};
}

describe('FileSystem', function () {

	beforeEach('create clean FS root', async function () {
		await fs.remove(fileSystemRoot);
		const rootPath = getRootPath();
		await fs.ensureDir(rootPath);
	});

	beforeEach('create clean tmp FS root', async function () {
		await fs.remove(tmpFileSystemRoot);
		await fs.ensureDir(tmpFileSystemRoot);
	});

	after(async function () {
		await fs.remove(fileSystemRoot);
		await fs.remove(tmpFileSystemRoot);
	});

	describe('listFiles', function () {

		it('should return list of files in a directory', async function () {
			const fileSystem = createFileSystem();
			const directoryFullPath = getAbsolutePath('directory');
			const file1FullPath = getAbsolutePath('directory/file1');
			const file2FullPath = getAbsolutePath('directory/file2');
			const file3FullPath = getAbsolutePath('directory/file3');
			await fs.ensureDir(directoryFullPath);
			await Promise.all([
				fs.writeFile(file1FullPath, 'contents1'),
				fs.writeFile(file2FullPath, 'contents2'),
				fs.writeFile(file3FullPath, 'contents3'),
			]);

			const filesList = await fileSystem.listFiles(getFilePathObject('directory'));
			filesList.length.should.equal(3);
			filesList[0].storageUnit.should.deepEqual(testStorageUnit);
			filesList[0].filePath.should.equal('directory/file1');
			filesList[1].storageUnit.should.deepEqual(testStorageUnit);
			filesList[1].filePath.should.equal('directory/file2');
			filesList[2].storageUnit.should.deepEqual(testStorageUnit);
			filesList[2].filePath.should.equal('directory/file3');
		});

		it('should fail if the path isn\'t directory', async function () {
			const fileSystem = createFileSystem();
			const fileFullPath = getAbsolutePath('file');
			await fs.writeFile(fileFullPath, 'contents');
			await fileSystem.listFiles(getFilePathObject('file')).should.be.rejected();
		});

		it('should fail if the path doesn\'t exist', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.listFiles(getFilePathObject('non_existent_directory')).should.be.rejected();
		});
	});

	describe('exists', function () {

		it('should return true if the file exists', async function () {
			const fileSystem = createFileSystem();
			const fileFullPath = getAbsolutePath('file');
			await fs.writeFile(fileFullPath, 'contents');
			const exists = await fileSystem.exists(getFilePathObject('file'));
			should(exists).be.true();
		});

		it('should return true if the directory exists', async function () {
			const fileSystem = createFileSystem();
			const dirFullPath = getAbsolutePath('directory');
			await fs.ensureDir(dirFullPath);
			const exists = await fileSystem.exists(getFilePathObject('directory'));
			should(exists).be.true();
		});

		it('should return false if the path doesn\'t exist', async function () {
			const fileSystem = createFileSystem();
			const exists = await fileSystem.exists(getFilePathObject('non_existent_directory'));
			should(exists).be.false();
		});
	});

	describe('downloadFile', function () {

		beforeEach('create protected directory', async function () {
			const directoryPath = getAbsolutePath('protected');
			await fs.ensureDir(directoryPath);
		});

		before('start static HTTP server', function (done: Function) {
			const expressApp = express();
			this.staticHttpServer = http.createServer(expressApp);
			// setup a protected directory that can only be accessed with correct Authorization header
			expressApp.use((request: express.Request, response: express.Response, next: Function) => {
				if (request.path.startsWith('/protected') && request.header('Authorization') !== 'coolAccessToken') {
					response.sendStatus(403);
				} else {
					next();
				}
			});
			const rootPath = getRootPath();
			expressApp.use(express.static(rootPath));
			this.staticHttpServer.listen(33333, (error: any) => {
				if (error) {
					throw new Error('Failed starting static HTTP server');
				} else {
					done();
				}
			});
		});

		after('close static HTTP server', function (done: Function) {
			this.staticHttpServer.close(done);
		});

		it('should download file', async function () {
			const fileSystem = createFileSystem();

			const sourceFilePath = getAbsolutePath('sourceFile');
			await fs.writeFile(sourceFilePath, 'source file to download');

			await fileSystem.downloadFile(
				getFilePathObject('downloadedFile'),
				'http://localhost:33333/sourceFile',
			);

			const downloadedFilePath = getAbsolutePath('downloadedFile');
			const downloadedFileContents = await fs.readFile(downloadedFilePath);
			downloadedFileContents.toString().should.equal('source file to download');
		});

		it('should download file into a directory', async function () {
			const fileSystem = createFileSystem();

			const sourceFilePath = getAbsolutePath('sourceFile');
			await fs.writeFile(sourceFilePath, 'source file to download');
			const directoryPath = getAbsolutePath('directory');
			await fs.mkdir(directoryPath);

			await fileSystem.downloadFile(
				getFilePathObject('directory/downloadedFile'),
				'http://localhost:33333/sourceFile',
			);

			const downloadedFilePath = getAbsolutePath('directory/downloadedFile');
			const downloadedFileContents = await fs.readFile(downloadedFilePath);
			downloadedFileContents.toString().should.equal('source file to download');
		});

		it('should fail when destination directory doesn\'t exist', async function () {
			const fileSystem = createFileSystem();

			const sourceFilePath = getAbsolutePath('sourceFile');
			await fs.writeFile(sourceFilePath, 'source file to download');

			await fileSystem.downloadFile(
				getFilePathObject('directory/downloadedFile'),
				'http://localhost:33333/sourceFile',
			).should.be.rejected();
		});

		it('should fail downloading file from a protected path', async function () {
			const fileSystem = createFileSystem();
			const sourceFilePath = getAbsolutePath('protected/protectedFile1');
			await fs.writeFile(sourceFilePath, 'source protected file1');
			await fileSystem.downloadFile(
				getFilePathObject('downloadedFile2'),
				'http://localhost:33333/protected/protectedFile1',
			).should.be.rejected();
		});

		it('should download file from a protected path with a correct Authorization header', async function () {
			const fileSystem = createFileSystem();
			const sourceFilePath = getAbsolutePath('protected/protectedFile2');
			await fs.writeFile(sourceFilePath, 'source protected file2');
			await fileSystem.downloadFile(
				getFilePathObject('downloadedFile3'),
				'http://localhost:33333/protected/protectedFile2',
				{ Authorization: 'coolAccessToken' },
			);

			const downloadedFilePath = getAbsolutePath('downloadedFile3');
			const downloadedFileContents = await fs.readFile(downloadedFilePath);
			downloadedFileContents.toString().should.equal('source protected file2');
		});
	});

	describe('uploadFile', function () {

		before('start upload HTTP server', function (done: Function) {
			const expressApp = express();
			this.staticHttpServer = http.createServer(expressApp);

			expressApp.use(cors());
			expressApp.use(bodyParser.json());

			const storage = multer.memoryStorage();
			const upload = multer({ storage });

			expressApp.post(
				'/upload',
				upload.single('file'),
				async (request: express.Request, response: express.Response) => {
					if (request.header('should_fail') === 'yes') {
						response.sendStatus(400);
					} else {
						const fileName = (request as Express.Request).file.originalname;
						const contentsBuffer = (request as Express.Request).file.buffer;
						response.send({
							fileName,
							contents: contentsBuffer.toString(),
						});
					}
				},
			);

			this.staticHttpServer.listen(33333, (error: any) => {
				if (error) {
					throw new Error('Failed starting static HTTP server');
				} else {
					done();
				}
			});
		});

		after('close static HTTP server', function (done: Function) {
			this.staticHttpServer.close(done);
		});

		it('should upload file and get response with 200 status code and correct body', async function () {
			const fileSystem = createFileSystem();
			const sourceFilePath = getAbsolutePath('fileToUpload1');
			await fs.writeFile(sourceFilePath, 'file to upload 1');
			const response = await fileSystem.uploadFile(
				getFilePathObject('fileToUpload1'),
				'file',
				'http://localhost:33333/upload',
			);
			JSON.parse(response).should.be.deepEqual({
				fileName: 'fileToUpload1',
				contents: 'file to upload 1',
			});
		});

		it('should fail when server returns an error status code', async function () {
			const fileSystem = createFileSystem();
			const sourceFilePath = getAbsolutePath('fileToUpload2');
			await fs.writeFile(sourceFilePath, 'file to upload 2');
			await fileSystem.uploadFile(
				getFilePathObject('fileToUpload2'),
				'file',
				'http://localhost:33333/upload',
				{ should_fail: 'yes' },
			).should.be.rejected();
		});
	});

	describe('readFile', function () {

		it('should return contents of an existing file', async function () {
			const fileSystem = createFileSystem();
			const fileFullPath = getAbsolutePath('file1');
			await fs.writeFile(fileFullPath, 'test content in file1');
			const readFileContents = await fileSystem.readFile(getFilePathObject('file1'));
			readFileContents.should.equal('test content in file1');
		});

		it('should return contents of an existing file in a subdirectory', async function () {
			const fileSystem = createFileSystem();
			const subdirectoryFullPath = getAbsolutePath('subdirectory');
			const fileFullPath = getAbsolutePath('subdirectory/file2');
			await fs.mkdir(subdirectoryFullPath);
			await fs.writeFile(fileFullPath, 'test content in file2');
			const readFileContents = await fileSystem.readFile(getFilePathObject('subdirectory/file2'));
			readFileContents.should.equal('test content in file2');
		});

		it('should throw FileOrDirectoryNotFound exception for trying to read non-existent file', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.readFile(getFilePathObject('subdirectory/file3'))
				.should.be.rejectedWith(FileOrDirectoryNotFound);
		});
	});

	describe('writeFile', function () {

		it('should write contents to a file', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.writeFile(
				getFilePathObject('file4'),
				'test write content in file4',
			);
			const fileFullPath = getAbsolutePath('file4');
			const fileContents = await fs.readFile(fileFullPath);
			fileContents.toString().should.equal('test write content in file4');
		});

		it('should fail writing contents to a file in subdirectory', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.writeFile(
				getFilePathObject('subdirectory2/file5'),
				'test write content in file5',
			).should.be.rejected();
		});
	});

	describe('deleteFile', function () {

		it('should delete file', async function () {
			const fileSystem = createFileSystem();
			const fileFullPath = getAbsolutePath('file6');
			await fs.writeFile(fileFullPath, 'test content in file6');
			await fileSystem.deleteFile(getFilePathObject('file6'));
			await fs.pathExists(fileFullPath).should.resolvedWith(false);
		});

		it('should throw FileOrDirectoryNotFound exception for non-existent file', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.deleteFile(getFilePathObject('invalid'))
				.should.be.rejectedWith(FileOrDirectoryNotFound);
		});

		it('should throw error when trying to delete root', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.deleteFile(getFilePathObject('')).should.be.rejected();
		});
	});

	describe('moveFile', function () {

		it('should move file to a new location', async function () {
			const fileSystem = createFileSystem();
			const sourceFilePath = getAbsolutePath('source');
			await fs.writeFile(sourceFilePath, 'source file');
			await fileSystem.moveFile(getFilePathObject('source'), getFilePathObject('destination'));
			const destinationFilePath = getAbsolutePath('destination');
			const destinationContents = await fs.readFile(destinationFilePath);
			destinationContents.toString().should.equal('source file');
		});

		it('should throw error for non-existent source file', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.moveFile(getFilePathObject('source'), getFilePathObject('destination'))
				.should.be.rejected();
		});

		it('should throw error for already existing destination', async function () {
			const fileSystem = createFileSystem();
			const sourceFilePath = getAbsolutePath('source');
			const destinationFilePath = getAbsolutePath('destination');
			await fs.writeFile(sourceFilePath, 'source file');
			await fs.writeFile(destinationFilePath, 'destination file');
			await fileSystem.moveFile(getFilePathObject('source'), getFilePathObject('destination'))
				.should.be.rejected();
		});

		it('should throw error for non-existent destination parent directory', async function () {
			const fileSystem = createFileSystem();
			const sourceFilePath = getAbsolutePath('source');
			await fs.writeFile(sourceFilePath, 'source file');
			await fileSystem.moveFile(getFilePathObject('source'), getFilePathObject('directory/destination'))
				.should.be.rejected();
		});

		it('should throw error when trying to move root', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.moveFile(getFilePathObject(''), getFilePathObject('destination')).should.be.rejected();
		});
	});

	describe('getFileChecksum', function () {

		const testCases = [
			{
				fileName: 'fileHashTest1',
				contents: 'test content in file1',
				hashAlgorithm: 'md5',
				expectedChecksum: 'cea74dfe3b9857dfff26283f6aad9870',
			},
			{
				fileName: 'fileHashTest2',
				contents: 'test content in file2',
				hashAlgorithm: 'sha1',
				expectedChecksum: 'f29f12e19001f96da9c5a9f7f8a199ddf7b2c4d6',
			},
			{
				fileName: 'fileHashTest3',
				contents: 'test content in file3',
				hashAlgorithm: 'sha256',
				expectedChecksum: '6aac983cc4a926f34cb090071123ce7ea8d45adf2a6399a104148d0a14579a1c',
			},
			{
				fileName: 'fileHashTest4',
				contents: 'test content in file4',
				hashAlgorithm: 'sha512',
				// tslint:disable-next-line
				expectedChecksum: '18229405423f1da97a3365a757e8832486b43ceef99bab5ecd15564094cc18d422ff6fea48a009a7852121a002800631aacb1b46579cf5333e02ac84ee7e1069',
			},
		];

		testCases.forEach((testCase: typeof testCases[0]) => {
			it('should return file checksum using ' + testCase.hashAlgorithm, async function () {
				const fileSystem = createFileSystem();
				const fileFullPath = getAbsolutePath(testCase.fileName);
				await fs.writeFile(fileFullPath, testCase.contents);
				const checksum = await fileSystem.getFileChecksum(
					getFilePathObject(testCase.fileName),
					testCase.hashAlgorithm as any,
				);
				checksum.should.equal(testCase.expectedChecksum);
			});
		});

		it('should throw FileOrDirectoryNotFound for non-existent file', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.getFileChecksum(getFilePathObject('invalidFile'), 'md5' as any)
				.should.be.rejected();
		});
	});

	describe('extractFile', function() {

		it('should extract zip file into a given destination directory', async function() {
			const fileSystem = createFileSystem();
			const file1ToZip = getAbsolutePath('file1');
			const file2ToZip = getAbsolutePath('file2');
			const file3ToZip = getAbsolutePath('file3');
			const archiveAbsolutePath = getAbsolutePath('archive');
			await fs.writeFile(file1ToZip, 'file1 to zip');
			await fs.writeFile(file2ToZip, 'file2 to zip');
			await fs.writeFile(file3ToZip, 'file3 to zip');
			await promisify(child_process.exec)(`zip -j ${archiveAbsolutePath} ${file1ToZip} ${file2ToZip} ${file3ToZip}`);
			await fileSystem.extractFile(
				getFilePathObject('archive.zip'),
				getFilePathObject('destination'),
				'zip',
			);

			const unzippedFile1 = getAbsolutePath('destination/file1');
			const file1Contents = await fs.readFile(unzippedFile1);
			file1Contents.toString().should.equal('file1 to zip');

			const unzippedFile2 = getAbsolutePath('destination/file2');
			const file2Contents = await fs.readFile(unzippedFile2);
			file2Contents.toString().should.equal('file2 to zip');

			const unzippedFile3 = getAbsolutePath('destination/file3');
			const file3Contents = await fs.readFile(unzippedFile3);
			file3Contents.toString().should.equal('file3 to zip');
		});

		it('should throw error for non-existent archive', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.extractFile(
				getFilePathObject('non_existent_archive.zip'),
				getFilePathObject('destination'),
				'zip',
			).should.be.rejected();
		});

		it('should throw error for invalid method', async function () {
			const fileSystem = createFileSystem();
			const file1ToZip = getAbsolutePath('file1');
			await fs.writeFile(file1ToZip, 'file1 to zip');
			const archiveAbsolutePath = getAbsolutePath('archive.tar.gz');
			await promisify(child_process.exec)(`tar cvzf ${archiveAbsolutePath} ${file1ToZip}`);
			await fileSystem.extractFile(
				getFilePathObject('archive.tar.gz'),
				getFilePathObject('destination'),
				'tar.gz',
			).should.be.rejected();
		});
	});

	describe('createDirectory', function() {

		it('should create directory', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.createDirectory(getFilePathObject('new_directory'));
			const directoryFullPath = getAbsolutePath('new_directory');
			const stats = await fs.lstat(directoryFullPath);
			should(stats.isDirectory()).be.true();
		});

		it('should fail when directory already exists', async function () {
			const fileSystem = createFileSystem();
			const directoryFullPath = getAbsolutePath('new_directory');
			await fs.mkdir(directoryFullPath);
			await fileSystem.createDirectory(getFilePathObject('new_directory'))
				.should.be.rejected();
		});

		it('should fail when parent directory doesn\'t exist', async function() {
			const fileSystem = createFileSystem();
			await fileSystem.createDirectory(getFilePathObject('parent/new_directory'))
				.should.be.rejected();
		});
	});

	describe('ensureDirectory', function () {

		it('should create directory along with it\'s non-existent parent directory', async function () {
			const fileSystem = createFileSystem();
			await fileSystem.ensureDirectory(getFilePathObject('parent/new_directory'));
			const directoryFullPath = getAbsolutePath('parent/new_directory');
			const stats = await fs.lstat(directoryFullPath);
			should(stats.isDirectory()).be.true();
		});

		it('shouldn\'t do anything for a directory that already exists', async function () {
			const fileSystem = createFileSystem();
			const directoryFullPath = getAbsolutePath('parent/new_directory');
			await fs.ensureDir(directoryFullPath);
			await fileSystem.ensureDirectory(getFilePathObject('parent/new_directory'));
			const stats = await fs.lstat(directoryFullPath);
			should(stats.isDirectory()).be.true();
		});
	});

	describe('isDirectory', function () {

		it('should return true for directory', async function () {
			const fileSystem = createFileSystem();
			const directoryFullPath = getAbsolutePath('directory');
			await fs.mkdir(directoryFullPath);
			const isDirectory = await fileSystem.isDirectory(getFilePathObject('directory'));
			should(isDirectory).be.true();
		});

		it('should return false for file', async function () {
			const fileSystem = createFileSystem();
			const fileFullPath = getAbsolutePath('file');
			await fs.writeFile(fileFullPath, 'file1');
			const isDirectory = await fileSystem.isDirectory(getFilePathObject('file'));
			should(isDirectory).be.false();
		});
	});
});
