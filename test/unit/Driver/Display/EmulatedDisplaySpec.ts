import * as sinon from 'sinon';
import EmulatedDisplay from '../../../../src/Driver/Display/EmulatedDisplay';
import { ISystemAPI } from '../../../../src/API/SystemAPI';

function createSystemSettings(defaultVolume: number = 100) {
	return {
		getVolume: sinon.stub().resolves(defaultVolume),
		setVolume: sinon.spy(),
	};
}

describe('Driver.Display.EmulatedDisplay', function () {

	describe('getVolume', function () {

		const volumes = [0, 40, 100];
		for (let expectedVolume of volumes) {
			it('should return ' + expectedVolume, async function () {
				const systemSettings = createSystemSettings(expectedVolume);
				const display = new EmulatedDisplay(systemSettings as any, {} as ISystemAPI);
				const actualVolume = await display.getVolume();
				actualVolume.should.equal(expectedVolume);
			});
		}
	});

	describe('setVolume', function () {

		const volumes = [0, 60, 95];
		for (let volume of volumes) {
			it('should set volume ' + volume + ' in the system settings', async function () {
				const systemSettings = createSystemSettings();
				const display = new EmulatedDisplay(systemSettings as any, {} as ISystemAPI);
				await display.setVolume(volume);
				systemSettings.setVolume.callCount.should.equal(1);
				systemSettings.setVolume.getCall(0).args[0].should.equal(volume);
			});
		}
	});
});
