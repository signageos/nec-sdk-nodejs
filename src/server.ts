// polyfill promisify for node.js 5
import UnixSocketEventListener from './UnixSocket/UnixSocketEventListener';

require('util').promisify = require('util.promisify');
// polyfill WebSocket for node.js
(global as any).WebSocket = require('ws');

import * as express from 'express';
import * as path from 'path';
import * as AsyncLock from 'async-lock';
import nodeFetch from 'node-fetch';
import { CronJob } from 'cron';
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
import { createWsSocketServer } from '@signageos/lib/dist/WebSocket/wsServerFactory';
import { createSameThreadWebWorkerFactory } from '@signageos/front-display/es6/WebWorker/masterWebWorkerFactory';
import NECPD from '@signageos/nec-sdk/dist/NECPD';
import FileSystem from './FileSystem/FileSystem';
import FileSystemCache from './Cache/FileSystemCache';
import { fetch } from './WebWorker/serverFetch';
import OverlayRenderer from './Overlay/OverlayRenderer';
import CECListener from './CEC/CECListener';
import FileDetailsProvider from './FileSystem/FileDetailsProvider';
import FileMetadataCache from './FileSystem/FileMetadataCache';
import { createSystemAPI } from './API/SystemAPI';
import FSSystemSettings from './SystemSettings/FSSystemSettings';
import { performFactorySettingsIfWasntPerformedYet } from './SystemSettings/factorySettings';
import { createDisplay } from './Driver/Display/displayFactory';
import { createSensors } from './Driver/Sensors/sensorsFactory';
import { getAutoVerification } from './helper';
import { manageCpuFan } from './CPUFanManager/cpuFanManager';
import ThumbnailRequestHandler from './FileSystem/Thumbnail/ThumbnailRequestHandler';
import ImageResizer from './FileSystem/Image/ImageResizer';
import VideoThumbnailExtractor from './FileSystem/Video/VideoThumbnailExtractor';
import { createMonitors } from './Driver/Monitors/monitorsFactory';
import Network from './Network/Network';
const parameters = require('../config/parameters');

let raven: Raven.Client | undefined = undefined;

if (parameters.raven.enabled) {
	raven = Raven.config(parameters.raven.dsn, parameters.raven.config);
	raven.install();
	useRavenLogging();
}

(async () => {
	const systemAPI = createSystemAPI();
	const bridgeExpressApp = express();
	const fileSystem = new FileSystem(
		parameters.fileSystem.root,
		parameters.fileSystem.tmp,
		parameters.fileSystem.appFiles,
		'SIGUSR2',
		systemAPI,
	);
	const videoAPI = createVideoAPI();
	const fileMetadataCache = new FileMetadataCache(fileSystem);
	const thumbnailRequestHandler = new ThumbnailRequestHandler(parameters.server.file_system_url, bridgeExpressApp, fileSystem);
	const imageResizer = new ImageResizer(thumbnailRequestHandler);
	const videoThumbnailExtractor = new VideoThumbnailExtractor(thumbnailRequestHandler, imageResizer, videoAPI);
	const fileDetailsProvider = new FileDetailsProvider(fileSystem, videoAPI, fileMetadataCache, imageResizer, videoThumbnailExtractor);
	const cache = new FileSystemCache(fileSystem);
	await cache.initialize();
	const systemSettings = new FSSystemSettings(parameters.fileSystem.system);
	const overlayRenderer = new OverlayRenderer(fileSystem);
	const necPD = new NECPD();
	const display = await createDisplay(necPD, systemSettings, systemAPI);
	const sensors = await createSensors(necPD);
	const monitors = await createMonitors(necPD);
	const network = new Network();

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
		systemSettings,
		videoPlayer,
		overlayRenderer,
		fileDetailsProvider,
		display,
		sensors,
		monitors,
		network,
		systemAPI,
	);

	if (raven) {
		nativeDriver.getDeviceUid()
			.then((deviceUid: string) => {
				raven!.setUserContext({
					id: deviceUid,
				});
			})
			.catch((error: any) => console.error(error));
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

	const cecListener = new CECListener(display, parameters.video.socket_root, systemAPI);
	const bridgeServer = new BridgeServer(
		bridgeExpressApp,
		parameters.server.bridge_url,
		fileSystem,
		fileDetailsProvider,
		nativeDriver,
		display,
		systemSettings,
		videoPlayer,
		overlayRenderer,
		cecListener,
		createWsSocketServer,
		systemAPI,
	);

	async function stopApplication() {
		console.log('stopping application');
		await bridgeServer.stop();
		await Promise.all([
			videoPlayer.close(),
			cecListener.close(),
			nativeDriver.servletRunner.closeAll(),
		]);
		await systemAPI.applicationNotReady();
		console.log('application will exit');
		process.exit(0);
	}

	process.on('SIGINT', stopApplication);
	process.on('SIGTERM', stopApplication);
	process.removeAllListeners('uncaughtException');
	process.on('uncaughtException', (error: any) => console.error(error && error.stack ? error.stack : error));
	process.on('unhandledRejection', (error: Error) => {
		throw error;
	});

	const cecListenPromise = cecListener.listen()
		.catch((error: Error) => console.error('CEC initialization failed', error));

	await bridgeServer.start();
	await systemAPI.applicationReady();

	await videoPlayer.initialize();
	await cecListenPromise;
	await manageCpuFan(display, systemAPI);
	await performFactorySettingsIfWasntPerformedYet(display, systemSettings);

	async function syncDatetimeToDisplay() {
		try {
			await display.syncDatetimeWithSystem();
		} catch (error) {
			console.error('Sync datetime to display failed', error);
		}
	}

	await syncDatetimeToDisplay();
	// sync every 10 mins when it's a whole minute, because setting time to NEC display only sets hours and minutes
	const syncTimeJob = new CronJob('0 */10 * * * *', () => syncDatetimeToDisplay());
	syncTimeJob.start();
})().catch((error: any) => console.error(error));
