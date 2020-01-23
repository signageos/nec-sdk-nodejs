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
import ThumbnailRequestHandler from '../../../../src/FileSystem/Thumbnail/ThumbnailRequestHandler';
import { IVideoAPI } from '../../../../src/API/VideoAPI';
const parameters = require('../../../../config/parameters');

describe('FileSystem.Image.ImageResizer', function () {

	const getChecksum = promisify<string, checksum.ChecksumOptions, string>(checksum.file);

	const lastModifiedAt = 1574858888870;
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
			async getFileMimeType(_filePath: string) {
				return 'image/png';
			},
		} as ISystemAPI;
		const fileSystem = new FileSystem(FILE_SYSTEM_BASE_PATH, TMP_BASE_PATH, '/app', 'SIGUSR2', systemAPI, {} as IVideoAPI);
		const thumbnailRequestHandler = new ThumbnailRequestHandler(FILE_SYSTEM_URL, expressApp, fileSystem);
		const imageResizer = new ImageResizer(thumbnailRequestHandler);

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
			await fs.utimes(`${INTERNAL_BASE_PATH}/originalFile.png`, new Date(lastModifiedAt), new Date(lastModifiedAt));
			const storageUnit = { type: 'internal' } as IStorageUnit;
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile.png',
				},
				lastModifiedAt,
			);
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

		it('should serve thumbnail of video of zero second differently when touched', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.png`,
				`${INTERNAL_BASE_PATH}/originalFile.png`,
			);
			await fs.utimes(`${INTERNAL_BASE_PATH}/originalFile.png`, new Date(lastModifiedAt), new Date(lastModifiedAt));
			const storageUnit = { type: 'internal' } as IStorageUnit;
			const originalFilePath = {
				storageUnit,
				filePath: 'originalFile.png',
			};
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate(
				originalFilePath,
				lastModifiedAt,
			);
			should(thumbnailUriTemplate).equal(
				'http://localhost:6666/internal/.thumbnails/originalFile.png_image_{width}x{height}_fcdbfd23710eba6ca6d732748e941c35',
			);
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(200);
			const thumbnailBuffer = await thumbnailResponse.buffer();
			const tmpResizedFilePath = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePath, thumbnailBuffer);
			should(await getChecksum(tmpResizedFilePath, { algorithm: 'md5' })).equal('e08b5ac6c73b09b0d4ef359df54ffcc6');

			should(await fs.pathExists(`${INTERNAL_BASE_PATH}/.thumbnails/originalFile.png_image_360x360_fcdbfd23710eba6ca6d732748e941c35`)).true();

			// Serve changed file
			const newLastModifiedTime = 1574888888888;
			await fs.utimes(`${INTERNAL_BASE_PATH}/originalFile.png`, new Date(newLastModifiedTime), new Date(newLastModifiedTime));

			const thumbnailUriTemplate2 = imageResizer.getImageThumbnailUriTemplate(
				originalFilePath,
				newLastModifiedTime,
			);
			should(thumbnailUriTemplate2).equal(
				'http://localhost:6666/internal/.thumbnails/originalFile.png_image_{width}x{height}_fee8faf4efac43ae5e02f51058ea76de',
			);
			const thumbnailUri2 = thumbnailUriTemplate2.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse2 = await fetch(thumbnailUri2);
			should(thumbnailResponse2.status).equal(200);
			const thumbnailBuffer2 = await thumbnailResponse2.buffer();
			const tmpResizedFilePath2 = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePath2, thumbnailBuffer2);
			should(await getChecksum(tmpResizedFilePath2, { algorithm: 'md5' })).equal('e08b5ac6c73b09b0d4ef359df54ffcc6');

			should(await fs.pathExists(`${INTERNAL_BASE_PATH}/.thumbnails/originalFile.png_image_360x360_fcdbfd23710eba6ca6d732748e941c35`)).false();
			should(await fs.pathExists(`${INTERNAL_BASE_PATH}/.thumbnails/originalFile.png_image_360x360_fee8faf4efac43ae5e02f51058ea76de`)).true();
		});

		it('should redirect to right thumbnail url when file was modified', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.png`,
				`${INTERNAL_BASE_PATH}/originalFile.png`,
			);
			await fs.utimes(`${INTERNAL_BASE_PATH}/originalFile.png`, new Date(lastModifiedAt), new Date(lastModifiedAt));
			const storageUnit = { type: 'internal' } as IStorageUnit;
			const originalFilePath = {
				storageUnit,
				filePath: 'originalFile.png',
			};
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate(
				originalFilePath,
				lastModifiedAt,
			);
			should(thumbnailUriTemplate).equal(
				'http://localhost:6666/internal/.thumbnails/originalFile.png_image_{width}x{height}_fcdbfd23710eba6ca6d732748e941c35',
			);
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			// Serve changed file
			const newLastModifiedTime = 1574888888888;
			await fs.utimes(`${INTERNAL_BASE_PATH}/originalFile.png`, new Date(newLastModifiedTime), new Date(newLastModifiedTime));

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(200); // redirected
			const thumbnailBuffer = await thumbnailResponse.buffer();
			const tmpResizedFilePath = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePath, thumbnailBuffer);
			should(await getChecksum(tmpResizedFilePath, { algorithm: 'md5' })).equal('e08b5ac6c73b09b0d4ef359df54ffcc6');

			should(await fs.pathExists(`${INTERNAL_BASE_PATH}/.thumbnails/originalFile.png_image_360x360_fcdbfd23710eba6ca6d732748e941c35`)).false();
			should(await fs.pathExists(`${INTERNAL_BASE_PATH}/.thumbnails/originalFile.png_image_360x360_fee8faf4efac43ae5e02f51058ea76de`)).true();
		});

		it('should serve resized image from removable storage', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.png`,
				`${EXTERNAL_BASE_PATH}/usb1/originalFile.png`,
			);
			await fs.utimes(`${EXTERNAL_BASE_PATH}/usb1/originalFile.png`, new Date(lastModifiedAt), new Date(lastModifiedAt));
			const storageUnit = { type: 'usb1', removable: true } as IStorageUnit;
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile.png',
				},
				lastModifiedAt,
			);
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
				await fs.utimes(`${INTERNAL_BASE_PATH}/${curiousFileName}/originalFile.png`, new Date(lastModifiedAt), new Date(lastModifiedAt));
				const storageUnit = { type: 'internal' } as IStorageUnit;
				const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate(
					{
						storageUnit,
						filePath: `${curiousFileName}/originalFile.png`,
					},
					lastModifiedAt,
				);
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
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile.png',
				},
				lastModifiedAt,
			);
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(400);
		});

		it('should return 400 when storage unit does not exist', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.png`,
				`${INTERNAL_BASE_PATH}/originalFile.png`,
			);
			await fs.utimes(`${INTERNAL_BASE_PATH}/originalFile.png`, new Date(lastModifiedAt), new Date(lastModifiedAt));
			const storageUnit = { type: 'typohere', removable: true } as IStorageUnit;
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile.png',
				},
				lastModifiedAt,
			);
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(400);
		});

		it('should return 404 when thumbnail uri is not valid', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.png`,
				`${INTERNAL_BASE_PATH}/originalFile.png`,
			);
			await fs.utimes(`${INTERNAL_BASE_PATH}/originalFile.png`, new Date(lastModifiedAt), new Date(lastModifiedAt));
			const storageUnit = { type: 'internal', removable: true } as IStorageUnit;
			const thumbnailUriTemplate = imageResizer.getImageThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile.png',
				},
				lastModifiedAt,
			);
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', 'typo').replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(404);
		});
	});
});
