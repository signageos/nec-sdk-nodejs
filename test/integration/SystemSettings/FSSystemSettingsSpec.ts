import * as should from 'should';
import * as path from 'path';
import * as fs from 'fs-extra';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import FSSystemSettings from '../../../src/SystemSettings/FSSystemSettings';

const parameters = require('../../../config/server_parameters');
const fileSystemRoot = parameters.fileSystem.system;
const systemSettingsFilePath = path.join(fileSystemRoot, 'system_settings.json');

describe('SystemSettings.FSSystemSettings', function () {

	beforeEach('create clean FS root', async function () {
		await fs.remove(fileSystemRoot);
		await fs.ensureDir(fileSystemRoot);
	});

	after(async function () {
		await fs.remove(fileSystemRoot);
	});

	describe('getVolume', function () {

		it('should return default volume 100 when there are no settings yet', async function () {
			const fsSystemSettings = new FSSystemSettings(fileSystemRoot);
			const volume = await fsSystemSettings.getVolume();
			should(volume).be.equal(100);
		});

		it('should return value saved to file system previously', async function () {
			const settings = { volume: 55 };
			await fs.writeFile(systemSettingsFilePath, JSON.stringify(settings));
			const fsSystemSettings = new FSSystemSettings(fileSystemRoot);
			const volume = await fsSystemSettings.getVolume();
			should(volume).equal(55);
		});

		it('should return value that was previously set via setVolume method', async function () {
			const fsSystemSettings = new FSSystemSettings(fileSystemRoot);
			await fsSystemSettings.setVolume(14);
			const volume = await fsSystemSettings.getVolume();
			should(volume).equal(14);
		});
	});

	describe('setVolume', function () {

		it('should save new settings to file system', async function () {
			const fsSystemSettings = new FSSystemSettings(fileSystemRoot);
			await fsSystemSettings.setVolume(14);
			const settingsBuffer = await fs.readFile(systemSettingsFilePath);
			const settings = JSON.parse(settingsBuffer.toString());
			should(settings).deepEqual({
				volume: 14,
			});
		});
	});

	const orientations: Orientation[] = [
		Orientation.LANDSCAPE,
		Orientation.PORTRAIT,
		Orientation.LANDSCAPE_FLIPPED,
		Orientation.PORTRAIT_FLIPPED,
	];

	describe('getScreenOrientation', function () {

		it('should return default landscape orientation when there are no settings yet', async function () {
			const fsSystemSettings = new FSSystemSettings(fileSystemRoot);
			const screenOrientation = await fsSystemSettings.getScreenOrientation();
			should(screenOrientation).be.equal(Orientation.LANDSCAPE);
		});

		for (let orientation of orientations) {
			it(`should return value "${Orientation[orientation]}" saved to file system previously`, async function () {
				const settings = { screenOrientation: Orientation[orientation] };
				await fs.writeFile(systemSettingsFilePath, JSON.stringify(settings));
				const fsSystemSettings = new FSSystemSettings(fileSystemRoot);
				const screenOrientation = await fsSystemSettings.getScreenOrientation();
				should(screenOrientation).be.equal(orientation);
			});

			it(`should return value "${Orientation[orientation]}" set via setScreenOrientation method`, async function () {
				const fsSystemSettings = new FSSystemSettings(fileSystemRoot);
				await fsSystemSettings.setScreenOrientation(orientation);
				const screenOrientation = await fsSystemSettings.getScreenOrientation();
				should(screenOrientation).be.equal(orientation);
			});
		}
	});

	describe('setScreenOrientation', function () {

		for (let orientation of orientations) {
			it(`should save new orientation setting "${Orientation[orientation]}" to file system`, async function () {
				const fsSystemSettings = new FSSystemSettings(fileSystemRoot);
				await fsSystemSettings.setScreenOrientation(orientation);
				const settingsBuffer = await fs.readFile(systemSettingsFilePath);
				const settings = JSON.parse(settingsBuffer.toString());
				should(settings).deepEqual({
					screenOrientation: Orientation[orientation],
				});
			});
		}
	});
});
