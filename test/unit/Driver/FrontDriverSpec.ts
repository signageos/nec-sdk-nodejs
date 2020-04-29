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
		document: {
			getElementById: () => null,
			createElement: () => ({
				style: {},
			}),
			body: {
				appendChild: () => null,
			},
		},
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
			const browser = {
				getWrapperElement() {
					return {};
				},
			};

			const frontDriver = new FrontDriver(
				createWindow(),
				'1.0.0',
				'hug',
				bridge as any,
				{} as any,
				createMockSocket(),
				{} as any,
				{} as any,
				{} as any,
				browser as any,
			);
			const model = await frontDriver.getModel();
			model.should.equal('model1');
		});
	});
});
