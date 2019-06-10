import 'should';
import { EventEmitter } from 'events';
import * as sinon from 'sinon';
import FrontDriver from '../../../src/Driver/FrontDriver';
import {
	GetModel,
} from '../../../src/Bridge/bridgeSystemMessages';
import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';

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

			const frontDriver = new FrontDriver(createWindow(), 'hug', bridge as any, createMockSocket(), 'http://localhost:8081');
			const model = await frontDriver.getModel();
			model.should.equal('model1');
		});
	});
});
