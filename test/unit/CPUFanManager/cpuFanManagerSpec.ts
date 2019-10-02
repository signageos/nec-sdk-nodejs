import * as sinon from 'sinon';
import { checkCpuTemperatureAndSetFanOnOff } from '../../../src/CPUFanManager/cpuFanManager';

function createMockDisplay() {
	return {
		cpuFanOn: sinon.stub().resolves(),
		cpuFanOff: sinon.stub().resolves(),
	};
}

describe('CPUFanManager.cpuFanManager', function () {

	describe('checkCpuTemperatureAndSetFanOnOff', function () {

		it('should set fan on when cpu is hot', async function () {
			const display = createMockDisplay();
			await checkCpuTemperatureAndSetFanOnOff(display as any, async () => 60);
			display.cpuFanOn.callCount.should.equal(1);
		});

		it('should set fan off when cpu is not hot', async function () {
			const display = createMockDisplay();
			await checkCpuTemperatureAndSetFanOnOff(display as any, async () => 35);
			display.cpuFanOff.callCount.should.equal(1);
		});

		it('shouldn\'t do anything when cpu is hot but it was already turned on', async function () {
			const display = createMockDisplay();
			await checkCpuTemperatureAndSetFanOnOff(display as any, async () => 60);
			await checkCpuTemperatureAndSetFanOnOff(display as any, async () => 60);
			display.cpuFanOn.callCount.should.equal(1);
		});

		it('shouldn\'t do anything when cpu is not hot but it was already turned off', async function () {
			const display = createMockDisplay();
			await checkCpuTemperatureAndSetFanOnOff(display as any, async () => 35);
			await checkCpuTemperatureAndSetFanOnOff(display as any, async () => 35);
			display.cpuFanOff.callCount.should.equal(1);
		});

		it('shouldn\'t do anything when cpu temperature is in the tolerance zone', async function () {
			const display = createMockDisplay();
			await checkCpuTemperatureAndSetFanOnOff(display as any, async () => 59);
			await checkCpuTemperatureAndSetFanOnOff(display as any, async () => 46);
			display.cpuFanOn.callCount.should.equal(0);
			display.cpuFanOff.callCount.should.equal(0);
		});
	});
});
