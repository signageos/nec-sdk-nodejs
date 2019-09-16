// polyfill promisify for node.js 5
import UnixSocketEventListener from './UnixSocket/UnixSocketEventListener';

require('util').promisify = require('util.promisify');
// polyfill WebSocket for node.js
(global as any).WebSocket = require('ws');

import * as path from 'path';
import * as AsyncLock from 'async-lock';
import nodeFetch from 'node-fetch';
import ManagementDriver from './Driver/ManagementDriver';
import ServerVideo from './Driver/Video/ServerVideo';
import ServerVideoPlayer from './Driver/Video/ServerVideoPlayer';
import {
	createVideoAPI,
} from './API/VideoAPI';
import management from '@signageos/front-display/es6/Management/management';
import BridgeServer from './Bridge/BridgeServer';
import * as Raven from 'raven';
import { useRavenLogging } from '@signageos/lib/dist/Logging/logger';
import { MINUTE_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import { createSameThreadWebWorkerFactory } from '@signageos/front-display/es6/WebWorker/masterWebWorkerFactory';
import FileSystem from './FileSystem/FileSystem';
import FileSystemCache from './Cache/FileSystemCache';
import { fetch } from './WebWorker/serverFetch';
import OverlayRenderer from './Overlay/OverlayRenderer';
import { NECAPI } from './API/NECAPI';
import CECListener from './CEC/CECListener';
import FileDetailsProvider from './FileSystem/FileDetailsProvider';
import FileMetadataCache from './FileSystem/FileMetadataCache';
import { applicationReady, applicationNotReady } from './API/SystemAPI';
import FSSystemSettings from './SystemSettings/FSSystemSettings';
import { createDisplay } from './Driver/Display/displayFactory';
import { createSensors } from './Driver/Sensors/sensorsFactory';
import { getAutoVerification } from './helper';
const parameters = require('../config/parameters');

let raven: Raven.Client | undefined = undefined;

if (parameters.raven.enabled) {
	raven = Raven.config(parameters.raven.dsn, parameters.raven.config);
	raven.install();
	useRavenLogging();
}

(async () => {
	const fileSystem = new FileSystem(
		parameters.fileSystem.root,
		parameters.fileSystem.tmp,
		parameters.fileSystem.appFiles,
		'SIGUSR2',
	);
	const videoAPI = createVideoAPI();
	const fileMetadataCache = new FileMetadataCache(fileSystem);
	const fileDetailsProvider = new FileDetailsProvider(fileSystem, videoAPI, fileMetadataCache);
	const cache = new FileSystemCache(fileSystem);
	await cache.initialize();
	const systemSettings = new FSSystemSettings(parameters.fileSystem.system);
	const overlayRenderer = new OverlayRenderer(fileSystem);
	const necAPI = new NECAPI();
	const display = await createDisplay(necAPI, systemSettings);
	const sensors = await createSensors(necAPI);

	const createVideo = (key: string) => {
		const unixSocketPath = path.join(parameters.video.socket_root, key + '.sock');
		const videoEventListener = new UnixSocketEventListener(unixSocketPath);
		return new ServerVideo(fileSystem, systemSettings, key, videoAPI, videoEventListener);
	};
	const videoPlayer = new ServerVideoPlayer(parameters.video.max_count, createVideo);

	const nativeDriver = new ManagementDriver(
		parameters.url.socketUri,
		parameters.server.file_system_url,
		cache,
		fileSystem,
		videoPlayer,
		overlayRenderer,
		fileDetailsProvider,
		display,
		sensors,
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
	const isOpen = parameters.bundledApplet !== null;
	const autoVerification = getAutoVerification();

	await management(
		nodeFetch as any,
		parameters.url.baseUrl,
		parameters.url.socketUri,
		parameters.url.staticBaseUrl,
		parameters.url.uploadBaseUrl,
		parameters.frontDisplay.sessionIdKey,
		nativeDriver,
		parameters.frontDisplay.version,
		offlineStorageLock,
		webWorkerFactory,
		parameters.app.version,
		isOpen,
		parameters.bundledServlet === null ? null : {
			filePath: {
				filePath: parameters.bundledServlet.filePath,
				storageUnit: fileSystem.getAppFilesStorageUnit(),
			},
			env: parameters.bundledServlet.env,
		},
		autoVerification,
	);

	const cecListener = new CECListener(display, parameters.video.socket_root);
	const bridgeServer = new BridgeServer(
		parameters.server.bridge_url,
		fileSystem,
		fileDetailsProvider,
		nativeDriver,
		display,
		videoPlayer,
		overlayRenderer,
		cecListener,
	);
	await bridgeServer.start();
	await applicationReady();

	async function stopApplication() {
		console.log('stopping application');
		await Promise.all([
			bridgeServer.stop(),
			nativeDriver.servletRunner.closeAll(),
		]);
		await applicationNotReady();
		console.log('application will exit');
		process.exit(0);
	}

	process.on('SIGINT', stopApplication);
	process.on('SIGTERM', stopApplication);
})().catch((error: any) => console.error(error));
