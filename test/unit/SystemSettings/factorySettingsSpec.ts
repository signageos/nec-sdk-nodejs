import * as sinon from 'sinon';
import { performFactorySettingsIfWasntPerformedYet } from '../../../src/SystemSettings/factorySettings';

describe('SystemSettings.factorySettings', function () {

	it('should set factory settings', async function () {
		const display = {
			resetSettings: sinon.stub().resolves(),
		};
		const systemSettings = {
			wasFactorySettingsPerformed: async () => false,
			setFactorySettingsPerformed: sinon.stub().resolves(),
		};
		await performFactorySettingsIfWasntPerformedYet(display as any, systemSettings as any);
		display.resetSettings.callCount.should.equal(1);
		systemSettings.setFactorySettingsPerformed.callCount.should.equal(1);
	});

	it('shouldn\'t set factory settings when previously set', async function () {
		const display = {
			resetSettings: sinon.stub().resolves(),
		};
		const systemSettings = {
			wasFactorySettingsPerformed: async () => true,
			setFactorySettingsPerformed: sinon.stub().resolves(),
		};
		await performFactorySettingsIfWasntPerformedYet(display as any, systemSettings as any);
		display.resetSettings.callCount.should.equal(0);
		systemSettings.setFactorySettingsPerformed.callCount.should.equal(0);
	});
});
