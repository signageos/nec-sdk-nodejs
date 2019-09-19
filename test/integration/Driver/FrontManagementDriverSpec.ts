import { EventEmitter } from 'events';
import * as moment from 'moment';
import * as sinon from 'sinon';
import BridgeClient from '../../../src/Bridge/BridgeClient';
import { createBridgeAndItsDependencies } from '../Bridge/bridgeManagement';
import FrontManagementDriver from '../../../src/Driver/FrontManagementDriver';

function createFrontManagementDriver(bridgeClient: BridgeClient) {
	return new FrontManagementDriver(bridgeClient, new EventEmitter() as any, 'file://');
}

describe('Driver.FrontManagementDriver', function () {

	beforeEach('start bridge server', async function () {
		this.bridge = await createBridgeAndItsDependencies();
		await this.bridge.bridgeServer.start();
	});

	afterEach('stop bridge server', async function () {
		await this.bridge.bridgeServer.stop();
	});

	describe('getCurrentTimeWithTimezone', function () {

		it('should return current datetime, timezone and ntp server settings', async function () {
			const frontManagementDriver = createFrontManagementDriver(this.bridge.bridgeClient);
			const expectedCurrentTimeWithTimezone = {
				currentDate: new Date(2019, 7, 8, 8, 30, 40),
				timezone: 'Europe/Prague',
				ntpServer: 'pool.ntp.org',
			};
			this.bridge.nativeDriver.getCurrentTimeWithTimezone = async () => expectedCurrentTimeWithTimezone;
			const actualCurrentTimeWithTimezone = await frontManagementDriver.getCurrentTimeWithTimezone();
			actualCurrentTimeWithTimezone.should.deepEqual(expectedCurrentTimeWithTimezone);
		});
	});

	describe('setManualTimeWithTimezone', function () {

		it('should set time and timezone', async function () {
			const frontManagementDriver = createFrontManagementDriver(this.bridge.bridgeClient);
			this.bridge.nativeDriver.setManualTimeWithTimezone = sinon.stub().resolves();
			const expectedDatetime = new Date(2019, 7, 8, 10, 20);
			await frontManagementDriver.setManualTimeWithTimezone(moment(expectedDatetime), 'Europe/Paris');
			this.bridge.nativeDriver.setManualTimeWithTimezone.callCount.should.equal(1);
			this.bridge.nativeDriver.setManualTimeWithTimezone.getCall(0).args[0].toISOString().should.equal(expectedDatetime.toISOString());
			this.bridge.nativeDriver.setManualTimeWithTimezone.getCall(0).args[1].should.equal('Europe/Paris');
		});
	});

	describe('setNTPTimeWithTimezone', function () {

		it('should set ntp and timezone', async function () {
			const frontManagementDriver = createFrontManagementDriver(this.bridge.bridgeClient);
			this.bridge.nativeDriver.setNTPTimeWithTimezone = sinon.stub().resolves();
			await frontManagementDriver.setNTPTimeWithTimezone('pool.ntp.org', 'Asia/Tokyo');
			this.bridge.nativeDriver.setNTPTimeWithTimezone.callCount.should.equal(1);
			this.bridge.nativeDriver.setNTPTimeWithTimezone.getCall(0).args.should.deepEqual(['pool.ntp.org', 'Asia/Tokyo']);
		});
	});
});
