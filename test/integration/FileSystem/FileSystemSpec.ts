import 'should';
import * as fs from 'fs';
import { promisify } from 'util';
import * as path from 'path';
import * as http from 'http';
import * as express from 'express';
import { FileOrDirectoryNotFound } from '../../../src/FileSystem/IFileSystem';
import FileSystem from '../../../src/FileSystem/FileSystem';

const parameters = require('../../../config/parameters');
const fileSystemRoot = parameters.fileSystem.root;

describe('FileSystem', function () {

	async function rmdirRecursive(directory: string) {
		const filenames = await promisify(fs.readdir)(directory);
		for (let filename of filenames) {
			const filePath = path.join(directory, filename);
			const stats = await promisify(fs.lstat)(filePath);
			if (stats.isDirectory()) {
				await rmdirRecursive(filePath);
			} else {
				await promisify(fs.unlink)(filePath);
			}
		}
		await promisify(fs.rmdir)(directory);
	}

	before(async function () {
		if (await promisify(fs.exists)(fileSystemRoot)) {
			await rmdirRecursive(fileSystemRoot);
		}

		await promisify(fs.mkdir)(fileSystemRoot);
	});

	after(async function () {
		await rmdirRecursive(fileSystemRoot);
	});

	describe('readFile', function () {

		it('should return contents of an existing file', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			const fileFullPath = path.join(fileSystemRoot, 'file1');
			await promisify(fs.writeFile)(fileFullPath, 'test content in file1');
			const readFileContents = await fileSystem.readFile('file1');
			readFileContents.should.equal('test content in file1');
		});

		it('should return contents of an existing file in a subdirectory', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			const subdirectoryFullPath = path.join(fileSystemRoot, 'subdirectory');
			const fileFullPath = path.join(subdirectoryFullPath, 'file2');
			await promisify(fs.mkdir)(subdirectoryFullPath);
			await promisify(fs.writeFile)(fileFullPath, 'test content in file2');
			const readFileContents = await fileSystem.readFile('subdirectory/file2');
			readFileContents.should.equal('test content in file2');
		});

		it('should throw FileOrDirectoryNotFound exception for trying to read non-existent file', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			await fileSystem.readFile('subdirectory/file3').should.be.rejectedWith(FileOrDirectoryNotFound);
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
				const fileSystem = new FileSystem(fileSystemRoot);
				const fileFullPath = path.join(fileSystemRoot, testCase.fileName);
				await promisify(fs.writeFile)(fileFullPath, testCase.contents);
				const checksum = await fileSystem.getFileChecksum(testCase.fileName, testCase.hashAlgorithm);
				checksum.should.equal(testCase.expectedChecksum);
			});
		});

		it('should throw FileOrDirectoryNotFound for non-existent file', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			await fileSystem.getFileChecksum('invalidFile', 'md5').should.be.rejected();
		});
	});

	describe('saveToFile', function () {

		it('should write contents to a file', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			await fileSystem.saveToFile('file4', 'test write content in file4');
			const fileFullPath = path.join(fileSystemRoot, 'file4');
			const fileContents = await promisify(fs.readFile)(fileFullPath);
			fileContents.toString().should.equal('test write content in file4');
		});

		it('should write contents to a file in subdirectory', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			await fileSystem.saveToFile('subdirectory2/file5', 'test write content in file5');
			const fileFullPath = path.join(fileSystemRoot, 'subdirectory2', 'file5');
			const fileContents = await promisify(fs.readFile)(fileFullPath);
			fileContents.toString().should.equal('test write content in file5');
		});
	});

	describe('deleteFile', function () {

		it('should delete file', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			const fileFullPath = path.join(fileSystemRoot, 'file6');
			await promisify(fs.writeFile)(fileFullPath, 'test content in file6');
			await fileSystem.deleteFile('file6');
			await promisify(fs.exists)(fileFullPath).should.be.resolvedWith(false);
		});

		it('should throw FileOrDirectoryNotFound exception for non-existent file', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			await fileSystem.deleteFile('invalid').should.be.rejectedWith(FileOrDirectoryNotFound);
		});
	});

	describe('downloadFile', function () {

		before('create protected directory', async function () {
			const directoryPath = path.join(fileSystemRoot, 'protected');
			const directoryExists = await promisify(fs.exists)(directoryPath);
			if (!directoryExists) {
				await promisify(fs.mkdir)(directoryPath);
			}
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
			expressApp.use(express.static(fileSystemRoot));
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
			const fileSystem = new FileSystem(fileSystemRoot);

			const sourceFilePath = path.join(fileSystemRoot, 'sourceFile');
			await promisify(fs.writeFile)(sourceFilePath, 'source file to download');

			await fileSystem.downloadFile('downloadedFile', 'http://localhost:33333/sourceFile');

			const downloadedFilePath = path.join(fileSystemRoot, 'downloadedFile');
			const downloadedFileContents = await promisify(fs.readFile)(downloadedFilePath);
			downloadedFileContents.toString().should.equal('source file to download');
		});

		it('should fail downloading file from a protected path', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			const sourceFilePath = path.join(fileSystemRoot, 'protected', 'protectedFile1');
			await promisify(fs.writeFile)(sourceFilePath, 'source protected file1');

			await fileSystem
				.downloadFile('downloadedFile2', 'http://localhost:33333/protected/protectedFile1')
				.should.be.rejected();
		});

		it('should download file from a protected path with a correct Authorization header', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			const sourceFilePath = path.join(fileSystemRoot, 'protected', 'protectedFile2');
			await promisify(fs.writeFile)(sourceFilePath, 'source protected file2');

			await fileSystem.downloadFile(
				'downloadedFile3',
				'http://localhost:33333/protected/protectedFile2',
				{ Authorization: 'coolAccessToken' },
			);

			const downloadedFilePath = path.join(fileSystemRoot, 'downloadedFile3');
			const downloadedFileContents = await promisify(fs.readFile)(downloadedFilePath);
			downloadedFileContents.toString().should.equal('source protected file2');
		});
	});

	describe('getFilesInDirectory', function () {

		it('should return filenames of all files in a given directory (but not directories or others)', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);

			const directory = 'anotherTestDirectory1';
			const directoryFullPath = path.join(fileSystemRoot, directory);
			await promisify(fs.mkdir)(directoryFullPath);

			const expectedFileNames: string[] = [];
			for (let i = 0; i < 10; i++) {
				const filename = 'file' + i;
				const fileFullPath = path.join(fileSystemRoot, directory, filename);
				await promisify(fs.writeFile)(fileFullPath, `test file${i} in a directory`);
				expectedFileNames.push(filename);
			}

			for (let i = 0; i < 4; i++) {
				const subdirName = 'subdir' + i;
				const subdirFullPath = path.join(fileSystemRoot, directory, subdirName);
				await promisify(fs.mkdir)(subdirFullPath);
			}

			const symlinkName = 'file1Symlink';
			const symlinkFullPath = path.join(fileSystemRoot, directory, symlinkName);
			const targetFileFullPath = path.join(fileSystemRoot, directory, 'file1');
			await promisify(fs.symlink)(targetFileFullPath, symlinkFullPath);

			const actualFileNames = await fileSystem.getFilesInDirectory(directory);
			actualFileNames.should.deepEqual(expectedFileNames);
		});

		it('should throw FileOrDirectoryNotFound exception for non-existent directory', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			await fileSystem.getFilesInDirectory('invalidDir').should.be.rejectedWith(FileOrDirectoryNotFound);
		});
	});

	describe('readFilesInDirectory', function () {

		it('should return contents of all files in a given directory', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);

			const directory = 'anotherTestDirectory2';
			const directoryFullPath = path.join(fileSystemRoot, directory);
			await promisify(fs.mkdir)(directoryFullPath);

			const expectedContents: { [filename: string]: string } = {};
			for (let i = 0; i < 10; i++) {
				const filename = 'file' + i;
				const fileFullPath = path.join(fileSystemRoot, directory, filename);
				const fileContents = `test file${i} in a directory`;
				await promisify(fs.writeFile)(fileFullPath, fileContents);
				expectedContents[filename] = fileContents;
			}

			const actualContents = await fileSystem.readFilesInDirectory(directory);
			actualContents.should.deepEqual(expectedContents);
		});

		it('should throw FileOrDirectoryNotFound exception for non-existent directory', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			await fileSystem.readFilesInDirectory('invalidDir').should.be.rejectedWith(FileOrDirectoryNotFound);
		});
	});

	describe('getFullPath', function () {

		it('should return absolute path to a given relative path', function () {
			const fileSystem = new FileSystem(fileSystemRoot);

			const fullPath1 = fileSystem.getFullPath('file1');
			fullPath1.should.equal(path.join(fileSystemRoot, 'file1'));

			const fullPath2 = fileSystem.getFullPath('file2');
			fullPath2.should.equal(path.join(fileSystemRoot, 'file2'));

			const fullPath3 = fileSystem.getFullPath('subdir/file3');
			fullPath3.should.equal(path.join(fileSystemRoot, 'subdir', 'file3'));
		});
	});

	describe('isFile', function () {

		it('should return true for file', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			const fileFullPath = path.join(fileSystemRoot, 'file111');
			await promisify(fs.writeFile)(fileFullPath, 'file111 contents');
			await fileSystem.isFile('file111').should.be.resolvedWith(true);
		});

		it('should return false for directory', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			const directoryFullPath = path.join(fileSystemRoot, 'directory2222');
			await promisify(fs.mkdir)(directoryFullPath);
			await fileSystem.isFile('directory2222').should.be.resolvedWith(false);
		});
	});

	describe('pathExists', function () {

		it('should return true for existing path', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			const fileFullPath = path.join(fileSystemRoot, 'file2222');
			await promisify(fs.writeFile)(fileFullPath, 'file2222 contents');
			await fileSystem.pathExists('file2222').should.be.resolvedWith(true);
		});

		it('should return false for non-existing path', async function () {
			const fileSystem = new FileSystem(fileSystemRoot);
			await fileSystem.pathExists('invalidFile').should.be.resolvedWith(false);
		});
	});
});
