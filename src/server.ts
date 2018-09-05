// polyfill promisify for node.js 5
require('util').promisify = require('util.promisify');
// polyfill WebSocket for node.js
(global as any).WebSocket = require('ws');

import * as AsyncLock from 'async-lock';
import ManagementDriver from './Driver/ManagementDriver';
import OmxplayerVideoPlayer from './Driver/Video/OmxplayerVideoPlayer';
import management from '@signageos/front-display/es6/Management/management';
import BridgeServer from './Bridge/BridgeServer';
import * as Raven from 'raven';
import { useRavenLogging } from '@signageos/lib/dist/Logging/logger';
import { SECOND_IN_MS, MINUTE_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import { createSameThreadWebWorkerFactory } from '@signageos/front-display/es6/WebWorker/masterWebWorkerFactory';
import FileSystem from './FileSystem/FileSystem';
import FileSystemCache from './Cache/FileSystemCache';
import { fetch } from './WebWorker/serverFetch';
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

	const webWorkerFactory = createSameThreadWebWorkerFactory(fetch);

	await management(
		parameters.url.baseUrl,
		parameters.url.socketUri,
		parameters.url.staticBaseUrl,
		parameters.url.uploadBaseUrl,
		parameters.frontDisplay.sessionIdKey,
		nativeDriver,
		offlineStorageLock,
		webWorkerFactory,
	);

	const videoPlayerLock = new AsyncLock({ timeout: 30 * SECOND_IN_MS });
	const videoPlayer = new OmxplayerVideoPlayer(parameters.paths.distPath, videoPlayerLock, fileSystem);

	const bridgeServer = new BridgeServer(parameters.server.bridge_url, fileSystem, nativeDriver, videoPlayer);
	await bridgeServer.start();
})().catch((error: any) => console.error(error));
