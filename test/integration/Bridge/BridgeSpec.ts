import * as sinon from 'sinon';
import * as PowerMessages from '../../../src/Bridge/bridgePowerMessages';
import TimerType from '@signageos/front-display/es6/NativeDevice/Timer/TimerType';
import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';
import { createBridgeAndItsDependencies } from './bridgeManagement';

describe('Bridge', function () {

	beforeEach('start bridge server', async function () {
		this.bridge = createBridgeAndItsDependencies();
		await this.bridge.bridgeServer.start();
	});

	afterEach('stop bridge server', async function () {
		await this.bridge.bridgeServer.stop();
	});

	describe('message', function () {

		describe('PowerMessages.GetTimers', function () {

			it('should return list of timers', async function () {
				const timers = [
					{
						type: TimerType.TIMER_4,
						timeOn: '04:45:00',
						timeOff: '23:15:00',
						weekdays: [TimerWeekday.tue],
						volume: 20,
					},
					{
						type: TimerType.TIMER_5,
						timeOn: '06:00:00',
						timeOff: null,
						weekdays: [TimerWeekday.thu, TimerWeekday.fri, TimerWeekday.sat],
						volume: 75,
					},
					{
						type: TimerType.TIMER_5,
						timeOn: null,
						timeOff: '23:59:00',
						weekdays: [TimerWeekday.mon, TimerWeekday.wed, TimerWeekday.fri],
						volume: 100,
					},
				];
				this.bridge.nativeDriver.getTimers = async () => timers;
				const result = await this.bridge.bridgeClient.invoke({ type: PowerMessages.GetTimers });
				result.should.deepEqual({ timers });
			});
		});

		describe('PowerMessages.SetTimer', function () {

			it('should set timer', async function () {
				this.bridge.nativeDriver.setTimer = sinon.stub().resolves();

				await this.bridge.bridgeClient.invoke({
					type: PowerMessages.SetTimer,
					timerType: TimerType.TIMER_1,
					timeOn: '08:00:00',
					timeOff: '20:00:00',
					weekdays: [TimerWeekday.wed, TimerWeekday.thu, TimerWeekday.fri],
					volume: 20,
				} as PowerMessages.SetTimer);
				await this.bridge.bridgeClient.invoke({
					type: PowerMessages.SetTimer,
					timerType: TimerType.TIMER_2,
					timeOn: '10:30:00',
					timeOff: null,
					weekdays: [TimerWeekday.mon, TimerWeekday.tue],
					volume: 50,
				} as PowerMessages.SetTimer);
				await this.bridge.bridgeClient.invoke({
					type: PowerMessages.SetTimer,
					timerType: TimerType.TIMER_3,
					timeOn: null,
					timeOff: '22:00:00',
					weekdays: [TimerWeekday.sat, TimerWeekday.sun],
					volume: 100,
				} as PowerMessages.SetTimer);

				this.bridge.nativeDriver.setTimer.callCount.should.equal(3);
				this.bridge.nativeDriver.setTimer.getCall(0).args.should.deepEqual([
					TimerType.TIMER_1,
					'08:00:00',
					'20:00:00',
					[TimerWeekday.wed, TimerWeekday.thu, TimerWeekday.fri],
					20,
				]);
				this.bridge.nativeDriver.setTimer.getCall(1).args.should.deepEqual([
					TimerType.TIMER_2,
					'10:30:00',
					null,
					[TimerWeekday.mon, TimerWeekday.tue],
					50,
				]);
				this.bridge.nativeDriver.setTimer.getCall(2).args.should.deepEqual([
					TimerType.TIMER_3,
					null,
					'22:00:00',
					[TimerWeekday.sat, TimerWeekday.sun],
					100,
				]);
			});
		});
	});
});
