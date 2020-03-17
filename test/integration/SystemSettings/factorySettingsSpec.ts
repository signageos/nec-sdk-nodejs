import * as should from 'should';
import * as sinon from 'sinon';
import { performDisplayFactorySettingsIfWasntPerformedYet } from '../../../src/SystemSettings/factorySettings';
import * as path from "path";
import * as fs from 'fs-extra';

const parameters = require('../../../config/server_parameters');
const fileSystemSystemRoot = parameters.fileSystem.system;

function getFlagFilePath() {
	return path.join(fileSystemSystemRoot, '.display_factory_settings_performed');
}

describe('SystemSettings.factorySettings', function () {

	beforeEach('create clean FS root', async function () {
		await fs.remove(fileSystemSystemRoot);
		await fs.ensureDir(fileSystemSystemRoot);
	});

	after(async function () {
		await fs.remove(fileSystemSystemRoot);
	});

	it('should set factory settings', async function () {
		const display = {
			resetSettings: sinon.stub().resolves(),
		};
		await performDisplayFactorySettingsIfWasntPerformedYet(display as any, fileSystemSystemRoot);
		display.resetSettings.callCount.should.equal(1);
		const fileExists = await fs.pathExists(getFlagFilePath());
		should(fileExists).be.true();
	});

	it('shouldn\'t set factory settings when previously set', async function () {
		const display = {
			resetSettings: sinon.stub().resolves(),
		};
		await fs.writeFile(getFlagFilePath(), '1');
		await performDisplayFactorySettingsIfWasntPerformedYet(display as any, fileSystemSystemRoot);
		display.resetSettings.callCount.should.equal(0);
	});
});
