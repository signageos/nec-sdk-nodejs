import * as should from 'should';
import * as express from 'express';
import * as os from 'os';
import fetch from 'node-fetch';
import * as http from 'http';
import * as fs from 'fs-extra';
import * as checksum from 'checksum';
import ImageResizer from "../../../../src/FileSystem/Image/ImageResizer";
import FileSystem from "../../../../src/FileSystem/FileSystem";
import { generateUniqueHash } from '@signageos/lib/dist/Hash/generator';
import { promisify } from 'util';
import { IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { ISystemAPI } from '../../../../src/API/SystemAPI';
const parameters = require('../../../../config/parameters');

describe('FileSystem.Image.ImageResizer', function () {

	const getChecksum = promisify<string, checksum.ChecksumOptions, string>(checksum.file);

	const TEST_PORT = 6666;
	const FILE_SYSTEM_URL = `http://localhost:${TEST_PORT}`;
	const FILE_SYSTEM_BASE_PATH = parameters.paths.rootPath + '/test_fs/base/directory';
	const FIXTURES_BASE_PATH = parameters.paths.rootPath + '/test/integration/FileSystem/Image/fixtures';
	const INTERNAL_BASE_PATH = `${FILE_SYSTEM_BASE_PATH}/internal`;
	const EXTERNAL_BASE_PATH = `${FILE_SYSTEM_BASE_PATH}/external`;
	const TMP_BASE_PATH = os.tmpdir() + '/tests';

	describe('routeResizing', function () {

		const expressApp = express();
		const httpServer = http.createServer(expressApp);
		const systemAPI = {
			async getStorageStatus() {
				return [
					{
						type: 'internal',
					},
					{
						type: 'usb1',
						removable: true,
					},
				];
			},
		} as ISystemAPI;
		const fileSystem = new FileSystem(FILE_SYSTEM_BASE_PATH, TMP_BASE_PATH, '/app', 'SIGUSR2', systemAPI);
		const imageResizer = new ImageResizer(FILE_SYSTEM_URL, expressApp, fileSystem);

		before((done: Function) => {
			httpServer.listen(TEST_PORT, done);
		});

		beforeEach(async function () {
			await fs.remove(FILE_SYSTEM_BASE_PATH);
			await fs.mkdirp(TMP_BASE_PATH);
			await fs.mkdirp(INTERNAL_BASE_PATH);
			await fs.mkdirp(EXTERNAL_BASE_PATH + '/usb1');
		});

		after((done: Function) => {
			httpServer.close(done);
		});

		afterEach(async function () {
			await fs.remove(TMP_BASE_PATH);
			await fs.remove(FILE_SYSTEM_BASE_PATH);
		});

		it('should serve resized image', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.png`,
				`${INTERNAL_BASE_PATH}/originalFile.png`,
			);
			const storageUnit = { type: 'internal' } as IStorageUnit;
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate({
				storageUnit,
				filePath: 'originalFile.png',
			});
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(200);
			const thumbnailBuffer = await thumbnailResponse.buffer();
			const tmpResizedFilePath = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePath, thumbnailBuffer);
			should(await getChecksum(tmpResizedFilePath, { algorithm: 'md5' })).equal('e08b5ac6c73b09b0d4ef359df54ffcc6');

			// Second serve is from cache
			const thumbnailResponseFromCache = await fetch(thumbnailUri);
			should(thumbnailResponseFromCache.status).equal(200);
			const thumbnailBufferFromCache = await thumbnailResponseFromCache.buffer();
			const tmpResizedFilePathFromCache = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePathFromCache, thumbnailBufferFromCache);
			should(await getChecksum(tmpResizedFilePathFromCache, { algorithm: 'md5' })).equal('e08b5ac6c73b09b0d4ef359df54ffcc6');
		});

		it('should serve resized image from removable storage', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.png`,
				`${EXTERNAL_BASE_PATH}/usb1/originalFile.png`,
			);
			const storageUnit = { type: 'usb1', removable: true } as IStorageUnit;
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate({
				storageUnit,
				filePath: 'originalFile.png',
			});
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(200);
			const thumbnailBuffer = await thumbnailResponse.buffer();
			const tmpResizedFilePath = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePath, thumbnailBuffer);
			should(await getChecksum(tmpResizedFilePath, { algorithm: 'md5' })).equal('e08b5ac6c73b09b0d4ef359df54ffcc6');

			// Second serve is from cache
			const thumbnailResponseFromCache = await fetch(thumbnailUri);
			should(thumbnailResponseFromCache.status).equal(200);
			const thumbnailBufferFromCache = await thumbnailResponseFromCache.buffer();
			const tmpResizedFilePathFromCache = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePathFromCache, thumbnailBufferFromCache);
			should(await getChecksum(tmpResizedFilePathFromCache, { algorithm: 'md5' })).equal('e08b5ac6c73b09b0d4ef359df54ffcc6');
		});

		const CURIOUS_FILE_NAMES = [
			'můj',
			'ahoj smezerou ',
			'foldříče',
			'čeväbćîçö',
			'866255',
			'můjfoldříčeplnyčeväbćîçö23657466875236',
			'můj foldříče plny super čeväbćîçö 23657466875236 866255',
		];

		CURIOUS_FILE_NAMES.forEach((curiousFileName: string) => {
			it(`should serve resized image with curious name: ${curiousFileName}`, async function () {
				await fs.ensureDir(`${INTERNAL_BASE_PATH}/${curiousFileName}`);
				await fs.copy(
					`${FIXTURES_BASE_PATH}/originalFile.png`,
					`${INTERNAL_BASE_PATH}/${curiousFileName}/originalFile.png`,
				);
				const storageUnit = { type: 'internal' } as IStorageUnit;
				const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate({
					storageUnit,
					filePath: `${curiousFileName}/originalFile.png`,
				});
				const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

				const thumbnailResponse = await fetch(thumbnailUri);
				should(thumbnailResponse.status).equal(200);
				const thumbnailBuffer = await thumbnailResponse.buffer();
				const tmpResizedFilePath = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
				await fs.writeFile(tmpResizedFilePath, thumbnailBuffer);
				should(await getChecksum(tmpResizedFilePath, { algorithm: 'md5' })).equal('e08b5ac6c73b09b0d4ef359df54ffcc6');
			});
		});

		it('should return 400 when original does not exist', async function () {
			const storageUnit = { type: 'internal' } as IStorageUnit;
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate({
				storageUnit,
				filePath: 'originalFile.png',
			});
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(400);
		});

		it('should return 400 when storage unit does not exist', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.png`,
				`${INTERNAL_BASE_PATH}/originalFile.png`,
			);
			const storageUnit = { type: 'typohere', removable: true } as IStorageUnit;
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate({
				storageUnit,
				filePath: 'originalFile.png',
			});
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(400);
		});

		it('should return 400 when thumbnail uri is not valid', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.png`,
				`${INTERNAL_BASE_PATH}/originalFile.png`,
			);
			const storageUnit = { type: 'internal', removable: true } as IStorageUnit;
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate({
				storageUnit,
				filePath: 'originalFile.png',
			});
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', 'typo').replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(400);
		});
	});
});
