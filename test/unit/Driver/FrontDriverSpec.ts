import 'should';
import { EventEmitter } from 'events';
import * as sinon from 'sinon';
import FrontDriver from '../../../src/Driver/FrontDriver';
import {
	GetModel,
	SystemReboot,
} from '../../../src/Bridge/bridgeSystemMessages';
import ISocket from '@signageos/front-display/es6/Socket/ISocket';

function createWindow(override: any = {}): Window {
	return {
		addEventListener: sinon.spy(),
		...override,
	} as any;
}

function createMockSocket(): ISocket {
	return new EventEmitter() as any;
}

describe('Driver.FrontDriver', function () {

	describe('getModel', function () {

		it('should return model', async function () {
			const bridge = {
				invoke: sinon.stub()
					.withArgs({ type: GetModel })
					.resolves({ model: 'model1' }),
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver(createWindow(), 'hug', '1.0.0', bridge as any, createMockSocket(), 'http://localhost:8081');
			const model = await frontDriver.getModel();
			model.should.equal('model1');
		});
	});

	describe('appReboot', function () {

		it('should invoke device reboot', async function () {
			const bridge = {
				invoke: sinon.spy(),
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver(createWindow(), 'hug', '1.0.0', bridge as any, createMockSocket(), 'http://localhost:8081');
			await frontDriver.appReboot();
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args[0].should.deepEqual({ type: SystemReboot });
		});
	});

	describe('appRestart', function () {

		it('should invoke restarting of the application', async function () {
			const window: any = createWindow({
				location: {
					reload: sinon.spy(),
				},
			});
			const bridge = {
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver(window as any, 'hug', '1.0.0', bridge as any, createMockSocket(), 'http://localhost:8081');
			await frontDriver.appRestart();
			window.location.reload.callCount.should.equal(1);
		});
	});

	describe('getApplicationVersion', function () {

		it('should invoke restarting of the application', async function () {
			const bridge = { socketClient: new EventEmitter() };
			const frontDriver = new FrontDriver(createWindow(), 'hug', '1.0.0', bridge as any, createMockSocket(), 'http://localhost:8081');
			const applicationVersion = await frontDriver.getApplicationVersion();
			applicationVersion.should.equal('1.0.0');
		});
	});
});
