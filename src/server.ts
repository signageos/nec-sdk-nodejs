// polyfill promisify for node.js 5
require('util').promisify = require('util.promisify');

import * as AsyncLock from 'async-lock';
import ManagementDriver from './Driver/ManagementDriver';
import management from '@signageos/front-display/es6/Management/management';
import BridgeServer from './Bridge/BridgeServer';
import * as Raven from 'raven';
import { useRavenLogging } from '@signageos/lib/dist/Logging/logger';
import { MINUTE_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import { createWebWorkerFactory } from '@signageos/front-display/es6/WebWorker/masterWebWorkerFactory';
const TinyWorker = require('tiny-worker');
import FileSystem from './FileSystem/FileSystem';
import FileSystemCache from './Cache/FileSystemCache';
const parameters = require('../config/parameters');

let raven: Raven.Client | undefined = undefined;

if (parameters.raven.enabled) {
	raven = Raven.config(parameters.raven.dsn, parameters.raven.config);
	raven.install();
	useRavenLogging();
}

(async () => {
	const fileSystem = new FileSystem(parameters.fileSystem.root);
	const cache = new FileSystemCache(fileSystem);

	const nativeDriver = new ManagementDriver(
		parameters.url.socketUri,
		cache,
	);

	if (raven) {
		try {
			const deviceUid = await nativeDriver.getDeviceUid();
			raven.setUserContext({
				id: deviceUid,
			});
		} catch (error) {
			console.error(error);
		}
	}

	const offlineStorageLock = new AsyncLock({
		timeout: 2 * MINUTE_IN_MS,
	});

	const webWorkerFile = parameters.paths.distPath + '/server/webWorker.js';
	const webWorkerFactory = createWebWorkerFactory(
		() => new TinyWorker(webWorkerFile) as Worker,
	);

	await management(
		parameters.url.baseUrl,
		parameters.url.socketUri,
		parameters.url.staticBaseUrl,
		parameters.url.uploadBaseUrl,
		parameters.app.sessionIdKey,
		nativeDriver,
		offlineStorageLock,
		webWorkerFactory,
	);

	const bridgeServer = new BridgeServer(parameters.server.port);
	await bridgeServer.start();
})().catch((error: any) => console.error(error));
