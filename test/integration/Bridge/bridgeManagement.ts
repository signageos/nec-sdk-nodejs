import * as sinon from 'sinon';
import BridgeServer from '../../../src/Bridge/BridgeServer';
import BridgeClient from '../../../src/Bridge/BridgeClient';
import { createMockSocketServerClientPair } from '../WebSocket/mockWebSocket';

const params = require('../../../config/parameters');

export async function createBridgeAndItsDependencies() {
	const fileSystem = {
		onStorageUnitsChanged: sinon.spy(),
	};
	const fileDetailsProvider = {};
	const nativeDriver = {};
	const display = {};
	const systemSettings = {};
	const videoPlayer = {
		initialize: sinon.stub().resolves(),
		close: sinon.stub().resolves(),
		addEventListener: sinon.spy(),
	};
	const overlayRenderer = {};
	const cecListener = {
		listen: sinon.stub().resolves(),
		close: sinon.stub().resolves(),
		onKeypress: sinon.spy(),
	};
	const { socketServer, socketClient } = createMockSocketServerClientPair();
	const socketServerWrapper = {
		server: socketServer,
		listen: () => Promise.resolve(),
		close: () => Promise.resolve(),
	};
	const bridgeServer = new BridgeServer(
		params.server.bridge_url,
		fileSystem as any,
		fileDetailsProvider as any,
		nativeDriver as any,
		display as any,
		videoPlayer as any,
		overlayRenderer as any,
		cecListener as any,
		() => (socketServerWrapper as any),
	);
	const bridgeClient = new BridgeClient(params.server.bridge_url, socketClient);
	return {
		fileSystem,
		fileDetailsProvider,
		nativeDriver,
		display,
		systemSettings,
		videoPlayer,
		overlayRenderer,
		cecListener,
		bridgeServer,
		bridgeClient,
	};
}
