import * as should from 'should';
import * as express from 'express';
import * as os from 'os';
import fetch from 'node-fetch';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as checksum from 'checksum';
import ImageResizer from "../../../../src/FileSystem/Image/ImageResizer";
import VideoThumbnailExtractor from "../../../../src/FileSystem/Video/VideoThumbnailExtractor";
import FileSystem from "../../../../src/FileSystem/FileSystem";
import { generateUniqueHash } from '@signageos/lib/dist/Hash/generator';
import { promisify } from 'util';
import { IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { ISystemAPI } from '../../../../src/API/SystemAPI';
import ThumbnailRequestHandler from '../../../../src/FileSystem/Thumbnail/ThumbnailRequestHandler';
import { IVideoAPI } from '../../../../src/API/VideoAPI';
import { checksumString } from '@signageos/front-display/es6/Hash/checksum';
const parameters = require('../../../../config/parameters');

describe('FileSystem.Video.VideoThumbnailExtractor', function () {

	const getChecksum = promisify<string, checksum.ChecksumOptions, string>(checksum.file);

	const lastModifiedAt = 1574858888870;
	const TEST_PORT = 6666;
	const FILE_SYSTEM_URL = `http://localhost:${TEST_PORT}`;
	const FILE_SYSTEM_BASE_PATH = parameters.paths.rootPath + '/test_fs/base/directory';
	const FIXTURES_BASE_PATH = parameters.paths.rootPath + '/test/integration/FileSystem/Video/fixtures';
	const INTERNAL_BASE_PATH = `${FILE_SYSTEM_BASE_PATH}/internal`;
	const EXTERNAL_BASE_PATH = `${FILE_SYSTEM_BASE_PATH}/external`;
	const VIDEO_FRAMES_DIR_PATH = path.join(os.tmpdir(), 'video-frames');
	const TMP_BASE_PATH = os.tmpdir() + '/tests';

	describe('routeResizing', function () {

		let mockVideoDurationMs: number = 0;
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
		const videoAPI = {
			getVideoDurationMs: async (_filePath: string) => mockVideoDurationMs,
		} as IVideoAPI;
		const fileSystem = new FileSystem(FILE_SYSTEM_BASE_PATH, TMP_BASE_PATH, '/app', 'SIGUSR2', systemAPI);
		const thumbnailRequestHandler = new ThumbnailRequestHandler(FILE_SYSTEM_URL, expressApp, fileSystem);
		const imageResizer = new ImageResizer(thumbnailRequestHandler);
		const videoThumbnailExtractor = new VideoThumbnailExtractor(thumbnailRequestHandler, imageResizer, videoAPI);

		before((done: Function) => {
			httpServer.listen(TEST_PORT, done);
		});

		beforeEach(async function () {
			await fs.remove(FILE_SYSTEM_BASE_PATH);
			await fs.remove(path.join(os.tmpdir(), 'video-frames'));
			await fs.mkdirp(TMP_BASE_PATH);
			await fs.mkdirp(INTERNAL_BASE_PATH);
			await fs.mkdirp(EXTERNAL_BASE_PATH + '/usb1');
			mockVideoDurationMs = 0;
		});

		after((done: Function) => {
			httpServer.close(done);
		});

		afterEach(async function () {
			await fs.remove(TMP_BASE_PATH);
			await fs.remove(FILE_SYSTEM_BASE_PATH);
		});

		it('should serve thumbnail of video of zero second', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.mp4`,
				`${INTERNAL_BASE_PATH}/originalFile.mp4`,
			);
			const storageUnit = { type: 'internal' } as IStorageUnit;
			const thumbnailUriTemplate = videoThumbnailExtractor.getVideoThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile.mp4',
				},
				lastModifiedAt,
			);
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(200);
			const thumbnailBuffer = await thumbnailResponse.buffer();
			const tmpResizedFilePath = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePath, thumbnailBuffer);
			should(await getChecksum(tmpResizedFilePath, { algorithm: 'md5' })).equal('0821c5b4185e079e2912447e98ccfa94');

			// Second serve is from cache
			const thumbnailResponseFromCache = await fetch(thumbnailUri);
			should(thumbnailResponseFromCache.status).equal(200);
			const thumbnailBufferFromCache = await thumbnailResponseFromCache.buffer();
			const tmpResizedFilePathFromCache = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePathFromCache, thumbnailBufferFromCache);
			should(await getChecksum(tmpResizedFilePathFromCache, { algorithm: 'md5' })).equal('0821c5b4185e079e2912447e98ccfa94');
		});

		it('should serve thumbnail of video of zero second from cached extracted frame', async function () {
			const frameFilePath = path.join(VIDEO_FRAMES_DIR_PATH, checksumString(`${INTERNAL_BASE_PATH}/originalFile.mp4`) + '.jpg');
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.png`,
				frameFilePath,
			);
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.mp4`,
				`${INTERNAL_BASE_PATH}/originalFile.mp4`,
			);
			const storageUnit = { type: 'internal' } as IStorageUnit;
			const thumbnailUriTemplate = videoThumbnailExtractor.getVideoThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile.mp4',
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

		it('should serve thumbnail of video of first second', async function () {
			mockVideoDurationMs = 3000;
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.mp4`,
				`${INTERNAL_BASE_PATH}/originalFile1.mp4`,
			);
			const storageUnit = { type: 'internal' } as IStorageUnit;
			const thumbnailUriTemplate = videoThumbnailExtractor.getVideoThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile1.mp4',
				},
				lastModifiedAt,
			);
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(200);
			const thumbnailBuffer = await thumbnailResponse.buffer();
			const tmpResizedFilePath = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePath, thumbnailBuffer);
			should(await getChecksum(tmpResizedFilePath, { algorithm: 'md5' })).equal('4620f4ff0b0d014562e99f0ba797a499');

			// Second serve is from cache
			const thumbnailResponseFromCache = await fetch(thumbnailUri);
			should(thumbnailResponseFromCache.status).equal(200);
			const thumbnailBufferFromCache = await thumbnailResponseFromCache.buffer();
			const tmpResizedFilePathFromCache = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePathFromCache, thumbnailBufferFromCache);
			should(await getChecksum(tmpResizedFilePathFromCache, { algorithm: 'md5' })).equal('4620f4ff0b0d014562e99f0ba797a499');
		});

		it('should serve thumbnail of video of zero second from removable storage', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.mp4`,
				`${EXTERNAL_BASE_PATH}/usb1/originalFile.mp4`,
			);
			const storageUnit = { type: 'usb1', removable: true } as IStorageUnit;
			const thumbnailUriTemplate = videoThumbnailExtractor.getVideoThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile.mp4',
				},
				lastModifiedAt,
			);
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(200);
			const thumbnailBuffer = await thumbnailResponse.buffer();
			const tmpResizedFilePath = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePath, thumbnailBuffer);
			should(await getChecksum(tmpResizedFilePath, { algorithm: 'md5' })).equal('0821c5b4185e079e2912447e98ccfa94');

			// Second serve is from cache
			const thumbnailResponseFromCache = await fetch(thumbnailUri);
			should(thumbnailResponseFromCache.status).equal(200);
			const thumbnailBufferFromCache = await thumbnailResponseFromCache.buffer();
			const tmpResizedFilePathFromCache = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
			await fs.writeFile(tmpResizedFilePathFromCache, thumbnailBufferFromCache);
			should(await getChecksum(tmpResizedFilePathFromCache, { algorithm: 'md5' })).equal('0821c5b4185e079e2912447e98ccfa94');
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
			it(`should serve thumbnail of video of zero second with curious name: ${curiousFileName}`, async function () {
				await fs.ensureDir(`${INTERNAL_BASE_PATH}/${curiousFileName}`);
				await fs.copy(
					`${FIXTURES_BASE_PATH}/originalFile.mp4`,
					`${INTERNAL_BASE_PATH}/${curiousFileName}/originalFile.mp4`,
				);
				const storageUnit = { type: 'internal' } as IStorageUnit;
				const thumbnailUriTemplate = videoThumbnailExtractor.getVideoThumbnailUriTemplate(
					{
						storageUnit,
						filePath: `${curiousFileName}/originalFile.mp4`,
					},
					lastModifiedAt,
				);
				const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

				const thumbnailResponse = await fetch(thumbnailUri);
				should(thumbnailResponse.status).equal(200);
				const thumbnailBuffer = await thumbnailResponse.buffer();
				const tmpResizedFilePath = `${TMP_BASE_PATH}/${generateUniqueHash()}`;
				await fs.writeFile(tmpResizedFilePath, thumbnailBuffer);
				should(await getChecksum(tmpResizedFilePath, { algorithm: 'md5' })).equal('0821c5b4185e079e2912447e98ccfa94');
			});
		});

		it('should return 400 when original does not exist', async function () {
			const storageUnit = { type: 'internal' } as IStorageUnit;
			const thumbnailUriTemplate = videoThumbnailExtractor.getVideoThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile.mp4',
				},
				lastModifiedAt,
			);
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(400);
		});

		it('should return 400 when storage unit does not exist', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.mp4`,
				`${INTERNAL_BASE_PATH}/originalFile.mp4`,
			);
			const storageUnit = { type: 'typohere', removable: true } as IStorageUnit;
			const thumbnailUriTemplate = videoThumbnailExtractor.getVideoThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile.mp4',
				},
				lastModifiedAt,
			);
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', (360).toString()).replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(400);
		});

		it('should return 404 when thumbnail uri is not valid', async function () {
			await fs.copy(
				`${FIXTURES_BASE_PATH}/originalFile.mp4`,
				`${INTERNAL_BASE_PATH}/originalFile.mp4`,
			);
			const storageUnit = { type: 'internal', removable: true } as IStorageUnit;
			const thumbnailUriTemplate = videoThumbnailExtractor.getVideoThumbnailUriTemplate(
				{
					storageUnit,
					filePath: 'originalFile.mp4',
				},
				lastModifiedAt,
			);
			const thumbnailUri = thumbnailUriTemplate.replace('{width}', 'typo').replace('{height}', (360).toString());

			const thumbnailResponse = await fetch(thumbnailUri);
			should(thumbnailResponse.status).equal(404);
		});
	});
});
