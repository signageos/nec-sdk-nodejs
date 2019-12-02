import * as should from 'should';
import * as sinon from 'sinon';
import NECDisplay from '../../../../src/Driver/Display/NECDisplay';
import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';
import { ScheduleEvent, ISchedule, OSDOrientation } from '../../../../src/API/NECAPI';
import ITimer from '@signageos/front-display/es6/NativeDevice/Timer/ITimer';
import TimerType from '@signageos/front-display/es6/NativeDevice/Timer/TimerType';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';

function createMockNECAPI() {
	return {
		isDisplayOn: sinon.stub(),
		powerOn: sinon.stub().resolves(),
		powerOff: sinon.stub().resolves(),
		getBrightness: sinon.stub(),
		setBrightness: sinon.stub().resolves(),
		getVolume: sinon.stub(),
		setVolume: sinon.stub().resolves(),
		getSchedules: sinon.stub().resolves(),
		setSchedule: sinon.stub().resolves(),
		disableSchedule: sinon.stub().resolves(),
		setDisplayTimeFromSystemTime: sinon.stub().resolves(),
		setOSDOrientation: sinon.stub().resolves(),
	};
}

describe('Driver.Display.NECDisplay', function () {

	describe('isPowerOn', function () {

		it('should return true when NEC API return true', async function () {
			const necAPI = createMockNECAPI();
			necAPI.isDisplayOn.resolves(true);
			const display = new NECDisplay(necAPI as any);
			const isPowerOn = await display.isPowerOn();
			should(isPowerOn).be.true();
		});

		it('should return false when NEC API return false', async function () {
			const necAPI = createMockNECAPI();
			necAPI.isDisplayOn.resolves(false);
			const display = new NECDisplay(necAPI as any);
			const isPowerOn = await display.isPowerOn();
			should(isPowerOn).be.false();
		});
	});

	describe('powerOff', function () {

		it('should call power off on NEC API', async function () {
			const necAPI = createMockNECAPI();
			const display = new NECDisplay(necAPI as any);
			await display.powerOff();
			necAPI.powerOff.callCount.should.equal(1);
		});
	});

	describe('powerOn', function () {

		it('should call power on on NEC API', async function () {
			const necAPI = createMockNECAPI();
			const display = new NECDisplay(necAPI as any);
			await display.powerOn();
			necAPI.powerOn.callCount.should.equal(1);
		});
	});

	describe('getBrightness', function () {

		const brightnesses = [0, 50, 100];
		for (let expectedBrightness of brightnesses) {
			it('should return ' + expectedBrightness, async function () {
				const necAPI = createMockNECAPI();
				necAPI.getBrightness.resolves(expectedBrightness);
				const display = new NECDisplay(necAPI as any);
				const actualBrightness = await display.getBrightness();
				should(actualBrightness).equal(expectedBrightness);
			});
		}
	});

	describe('setBrightness', function () {

		const brightnesses = [0, 50, 100];
		for (let brightness of brightnesses) {
			it('should set brightness value ' + brightness + ' on NEC API', async function () {
				const necAPI = createMockNECAPI();
				const display = new NECDisplay(necAPI as any);
				await display.setBrightness(brightness);
				necAPI.setBrightness.callCount.should.equal(1);
				should(necAPI.setBrightness.getCall(0).args[0]).equal(brightness);
			});
		}
	});

	describe('getVolume', function () {

		const volumes = [0, 50, 100];
		for (let expectedVolume of volumes) {
			it('should return ' + expectedVolume, async function () {
				const necAPI = createMockNECAPI();
				necAPI.getVolume.resolves(expectedVolume);
				const display = new NECDisplay(necAPI as any);
				const actualVolume = await display.getVolume();
				should(actualVolume).equal(expectedVolume);
			});
		}
	});

	describe('setVolume', function () {

		const volumes = [0, 50, 100];
		for (let volume of volumes) {
			it('should set volume value ' + volume + ' on NEC API', async function () {
				const necAPI = createMockNECAPI();
				const display = new NECDisplay(necAPI as any);
				await display.setVolume(volume);
				necAPI.setVolume.callCount.should.equal(1);
				should(necAPI.setVolume.getCall(0).args[0]).equal(volume);
			});
		}
	});

	describe('getTimers', function () {

		it('should convert schedules to timers and return them', async function () {
			const schedules: ISchedule[] = [
				{
					index: 0,
					event: ScheduleEvent.ON,
					hour: 8,
					minute: 0,
					days: 14,
				},
				{
					index: 1,
					event: ScheduleEvent.OFF,
					hour: 20,
					minute: 30,
					days: 14,
				},
				{
					index: 4,
					event: ScheduleEvent.ON,
					hour: 16,
					minute: 45,
					days: 96,
				},
				{
					index: 7,
					event: ScheduleEvent.OFF,
					hour: 18,
					minute: 1,
					days: 96,
				},
			];
			const expectedTimers: ITimer[] = [
				{
					type: TimerType.TIMER_1,
					timeOn: '08:00:00',
					timeOff: '20:30:00',
					weekdays: [TimerWeekday.tue, TimerWeekday.wed, TimerWeekday.thu],
					volume: 100,
				},
				{
					type: TimerType.TIMER_3,
					timeOn: '16:45:00',
					timeOff: null,
					weekdays: [TimerWeekday.sat, TimerWeekday.sun],
					volume: 100,
				},
				{
					type: TimerType.TIMER_4,
					timeOn: null,
					timeOff: '18:01:00',
					weekdays: [TimerWeekday.sat, TimerWeekday.sun],
					volume: 100,
				},
			];

			const necAPI = createMockNECAPI();
			necAPI.getSchedules.resolves(schedules);
			const display = new NECDisplay(necAPI as any);
			const actualTimers = await display.getTimers();
			actualTimers.should.deepEqual(expectedTimers);
		});
	});

	describe('setTimer', function () {

		const indexes = [
			{
				timerIndex: 0,
				onIndex: 0,
				offIndex: 1,
			},
			{
				timerIndex: 1,
				onIndex: 2,
				offIndex: 3,
			},
			{
				timerIndex: 2,
				onIndex: 4,
				offIndex: 5,
			},
			{
				timerIndex: 3,
				onIndex: 6,
				offIndex: 7,
			},
			{
				timerIndex: 4,
				onIndex: 8,
				offIndex: 9,
			},
			{
				timerIndex: 5,
				onIndex: 10,
				offIndex: 11,
			},
			{
				timerIndex: 6,
				onIndex: 12,
				offIndex: 13,
			},
		];

		for (let index of indexes) {
			it(
				`should set ON schedule on index ${index.onIndex} and OFF schedule on index ${index.offIndex} for timer index ${index.timerIndex}`,
				async function () {
					const necAPI = createMockNECAPI();
					const display = new NECDisplay(necAPI as any);
					await display.setTimer(index.timerIndex, '08:10:00', '21:30:00', [TimerWeekday.mon]);
					necAPI.setSchedule.callCount.should.equal(2);
					necAPI.setSchedule.getCall(0).args.should.deepEqual([index.onIndex, ScheduleEvent.ON, 8, 10, 1]);
					necAPI.setSchedule.getCall(1).args.should.deepEqual([index.offIndex, ScheduleEvent.OFF, 21, 30, 1]);
				},
			);

			it(
				`should set ON schedule on index ${index.onIndex} and disable schedule on index ${index.offIndex} for timer index ${index.timerIndex}`,
				async function () {
					const necAPI = createMockNECAPI();
					const display = new NECDisplay(necAPI as any);
					await display.setTimer(index.timerIndex, '08:10:00', null, [TimerWeekday.tue]);
					necAPI.setSchedule.callCount.should.equal(1);
					necAPI.setSchedule.getCall(0).args.should.deepEqual([index.onIndex, ScheduleEvent.ON, 8, 10, 2]);
					necAPI.disableSchedule.callCount.should.equal(1);
					necAPI.disableSchedule.getCall(0).args[0].should.equal(index.offIndex);
				},
			);

			it(
				`should disable schedule on index ${index.onIndex} and set OFF schedule on index ${index.offIndex} for timer index ${index.timerIndex}`,
				async function () {
					const necAPI = createMockNECAPI();
					const display = new NECDisplay(necAPI as any);
					await display.setTimer(index.timerIndex, null, '20:00:00', [TimerWeekday.wed]);
					necAPI.setSchedule.callCount.should.equal(1);
					necAPI.setSchedule.getCall(0).args.should.deepEqual([index.offIndex, ScheduleEvent.OFF, 20, 0, 4]);
					necAPI.disableSchedule.callCount.should.equal(1);
					necAPI.disableSchedule.getCall(0).args[0].should.equal(index.onIndex);
				},
			);

			it(
				`should disable schedules on indexes ${index.onIndex} and ${index.offIndex} for timer index ${index.timerIndex}`,
				async function () {
					const necAPI = createMockNECAPI();
					const display = new NECDisplay(necAPI as any);
					await display.setTimer(index.timerIndex, null, null, [TimerWeekday.thu]);
					necAPI.disableSchedule.callCount.should.equal(2);
					necAPI.disableSchedule.getCall(0).args[0].should.equal(index.onIndex);
					necAPI.disableSchedule.getCall(1).args[0].should.equal(index.offIndex);
				},
			);
		}

		const daysLists = [
			{
				days: [TimerWeekday.mon],
				expectedBytesValue: 1,
			},
			{
				days: [TimerWeekday.tue],
				expectedBytesValue: 2,
			},
			{
				days: [TimerWeekday.wed],
				expectedBytesValue: 4,
			},
			{
				days: [TimerWeekday.thu],
				expectedBytesValue: 8,
			},
			{
				days: [TimerWeekday.fri],
				expectedBytesValue: 16,
			},
			{
				days: [TimerWeekday.sat],
				expectedBytesValue: 32,
			},
			{
				days: [TimerWeekday.sun],
				expectedBytesValue: 64,
			},
			{
				days: [TimerWeekday.mon, TimerWeekday.tue],
				expectedBytesValue: 1 + 2,
			},
			{
				days: [TimerWeekday.mon, TimerWeekday.tue, TimerWeekday.sat],
				expectedBytesValue: 1 + 2 + 32,
			},
			{
				days: [TimerWeekday.tue, TimerWeekday.thu],
				expectedBytesValue: 2 + 8,
			},
			{
				days: [TimerWeekday.tue, TimerWeekday.thu, TimerWeekday.fri],
				expectedBytesValue: 2 + 8 + 16,
			},
			{
				days: [TimerWeekday.wed, TimerWeekday.thu, TimerWeekday.fri, TimerWeekday.sat],
				expectedBytesValue: 4 + 8 + 16 + 32,
			},
			{
				days: [TimerWeekday.mon, TimerWeekday.tue, TimerWeekday.wed, TimerWeekday.thu, TimerWeekday.fri, TimerWeekday.sat, TimerWeekday.sun],
				expectedBytesValue: 1 + 2 + 4 + 8 + 16 + 32 + 64,
			},
		];

		for (let daysList of daysLists) {
			const daysStringList = daysList.days.map((day: TimerWeekday) => TimerWeekday[day]);

			it(
				`should set ON and OFF schedules with days bytes value ${daysList.expectedBytesValue} for days [${daysStringList.join(',')}]`,
				async function () {
					const necAPI = createMockNECAPI();
					const display = new NECDisplay(necAPI as any);
					await display.setTimer(0, '08:00:00', '21:30:00', daysList.days);
					necAPI.setSchedule.callCount.should.equal(2);
					necAPI.setSchedule.getCall(0).args.should.deepEqual([0, ScheduleEvent.ON, 8, 0, daysList.expectedBytesValue]);
					necAPI.setSchedule.getCall(1).args.should.deepEqual([1, ScheduleEvent.OFF, 21, 30, daysList.expectedBytesValue]);
				},
			);
		}
	});

	describe('setOSDOrientation', function () {

		it('should set landscape orientation', async function () {
			const necAPI = createMockNECAPI();
			const display = new NECDisplay(necAPI as any);
			await display.setOSDOrientation(Orientation.LANDSCAPE);
			necAPI.setOSDOrientation.callCount.should.equal(1);
			necAPI.setOSDOrientation.getCall(0).args[0].should.equal(OSDOrientation.LANDSCAPE);
		});

		it('should set portrait orientation', async function () {
			const necAPI = createMockNECAPI();
			const display = new NECDisplay(necAPI as any);
			await display.setOSDOrientation(Orientation.PORTRAIT);
			necAPI.setOSDOrientation.callCount.should.equal(1);
			necAPI.setOSDOrientation.getCall(0).args[0].should.equal(OSDOrientation.PORTRAIT);
		});

		it('should set landscape orientation by default when unsupported landscape flipped orientation is given', async function () {
			const necAPI = createMockNECAPI();
			const display = new NECDisplay(necAPI as any);
			await display.setOSDOrientation(Orientation.LANDSCAPE_FLIPPED);
			necAPI.setOSDOrientation.callCount.should.equal(1);
			necAPI.setOSDOrientation.getCall(0).args[0].should.equal(OSDOrientation.LANDSCAPE);
		});

		it('should set landscape orientation by default when unsupported portrait flipped orientation is given', async function () {
			const necAPI = createMockNECAPI();
			const display = new NECDisplay(necAPI as any);
			await display.setOSDOrientation(Orientation.PORTRAIT_FLIPPED);
			necAPI.setOSDOrientation.callCount.should.equal(1);
			necAPI.setOSDOrientation.getCall(0).args[0].should.equal(OSDOrientation.LANDSCAPE);
		});
	});
});
