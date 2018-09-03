// polyfill promisify for node.js 5
require('util').promisify = require('util.promisify');

import * as AsyncLock from 'async-lock';
import BridgeClient from './Bridge/BridgeClient';
import FrontDriver from './Driver/FrontDriver';
import front from '@signageos/front-display/es6/Front/front';
import { createSocketSynchronizer } from '@signageos/front-display/es6/Front/Applet/Sync/synchronizerFactory';
import * as Raven from 'raven-js';
delete window.fetch;
import "whatwg-fetch";
import { useRavenLogging } from '@signageos/front-display/es6/Logging/logger';
import { MINUTE_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import { createWebWorkerFactory } from '@signageos/front-display/es6/WebWorker/masterWebWorkerFactory';
const parameters = require('../config/parameters');

if (parameters.raven.enabled) {
	Raven.config(parameters.raven.dsn, parameters.raven.config).install();
	useRavenLogging(window);
}

(async () => {
	const bridge = new BridgeClient(parameters.server.bridge_url);
	const nativeDriver = new FrontDriver(window, parameters.app.version, bridge, parameters.server.file_system_url);
	const synchronizer = createSocketSynchronizer(
		parameters.url.synchronizerServerUrl,
		() => nativeDriver,
	);

	try {
		const deviceUid = await nativeDriver.getDeviceUid();
		Raven.setUserContext({
			id: deviceUid,
		});
	} catch (error) {
		console.error(error);
	}

	const offlineStorageLock = new AsyncLock({
		timeout: 2 * MINUTE_IN_MS,
	});

	const webWorkerFactory = createWebWorkerFactory();

	await front(
		window,
		parameters.url.baseUrl,
		parameters.url.socketUri,
		parameters.url.staticBaseUrl,
		parameters.url.uploadBaseUrl,
		parameters.app.sessionIdKey,
		parameters.frontApplet.prefix,
		parameters.frontDisplay.version,
		parameters.url.weinreServerUrl,
		nativeDriver,
		synchronizer,
		offlineStorageLock,
		webWorkerFactory,
	);
})().catch((error: any) => console.error(error));
