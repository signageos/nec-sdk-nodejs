import * as url from 'url';
import * as http from 'http';
import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import { ISocketServerWrapper, ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import socketHandleMessage from './socketHandleMessage';
import socketHandleVideo from './socketHandleVideo';
import socketHandleCEC from './socketHandleCEC';
import socketHandleApplication from './socketHandleApplication';
import socketHandleStorageUnitsChanged from './socketHandleStorageUnitsChanged';
import socketHandleSensors from './socketHandleSensors';
import IFileSystem from '../FileSystem/IFileSystem';
import IFileDetailsProvider from '../FileSystem/IFileDetailsProvider';
import IServerVideoPlayer from '../Driver/Video/IServerVideoPlayer';
import OverlayRenderer from '../Overlay/OverlayRenderer';
import ICECListener from '../CEC/ICECListener';
import IDisplay from '../Driver/Display/IDisplay';
import * as SystemAPI from '../API/SystemAPI';

export default class BridgeServer {

	private readonly expressApp: express.Application;
	private readonly httpServer: http.Server;
	private readonly socketServer: ISocketServerWrapper;

	constructor(
		private serverUrl: string,
		private fileSystem: IFileSystem,
		private fileDetailsProvider: IFileDetailsProvider,
		private nativeDriver: IBasicDriver & IManagementDriver,
		private display: IDisplay,
		private videoPlayer: IServerVideoPlayer,
		private overlayRenderer: OverlayRenderer,
		private cecListener: ICECListener,
		private createSocketServer: (httpServer: http.Server) => ISocketServerWrapper
	) {
		this.expressApp = express();
		this.httpServer = http.createServer(this.expressApp);
		this.socketServer = this.createSocketServer(this.httpServer);
		this.defineHttpRoutes();
		this.handleSocketMessage();
	}

	public async start() {
		await this.videoPlayer.initialize();
		await new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			const serverUrl = url.parse(this.serverUrl);
			this.httpServer.setTimeout(60e3 * 60); // 1 hour
			this.httpServer.listen(
				{
					host: serverUrl.hostname!,
					port: parseInt(serverUrl.port!, 10),
				},
				(error: any) => {
					if (error) {
						console.error('failed to start BridgeServer', error);
						reject(new Error('Failed to start BridgeServer'));
					} else {
						console.info('BridgeServer started');
						resolve();
					}
				});
		});

		await this.socketServer.listen();
		await this.cecListener.listen();
	}

	public async stop() {
		console.log('stopping bridge server');
		await Promise.all([
			this.cecListener.close(),
			this.socketServer.close(),
		]);
		await new Promise<void>((resolve: () => void) => {
			this.httpServer.close(resolve);
		});
		await this.videoPlayer.close();
	}

	private defineHttpRoutes() {
		this.expressApp.use(cors());
		this.expressApp.use(bodyParser.json());

		const rawBody = bodyParser.raw({ inflate: true, limit: '100mb', type: '*/*' });
		this.expressApp.post('/firmware/overwrite', async (request: express.Request, response: express.Response) => {
			const { imgUrl } = request.body;
			if (imgUrl) {
				try {
					await SystemAPI.overwriteFirmware(imgUrl);
					response.sendStatus(200);
				} catch (error) {
					response.status(500).send(error.message);
				}
			} else {
				response.status(400).send('missing imgUrl');
			}
		});
		this.expressApp.post('/overlay', rawBody, async (request: express.Request, response: express.Response) => {
			const { id, width, height, x, y } = request.query;
			const fileBuffer = request.body;
			const animationDuration = request.query.animDuration ? parseInt(request.query.animDuration) : 0;
			const animationKeyframesCount = request.query.animKFCount || 0;
			let animate = false;
			let keyframes: {
				percentage: number;
				x: number;
				y: number
			}[] = [];

			try {
				if (animationKeyframesCount > 0) {
					animate = true;

					for (let i = 0; i < animationKeyframesCount; i++) {
						const keyframePercentage = request.query['animKF' + i + '_percent'];
						const keyframeX = request.query['animKF' + i + '_x'];
						const keyframeY = request.query['animKF' + i + '_y'];

						if (keyframePercentage && keyframeX && keyframeY) {
							keyframes.push({
								percentage: parseInt(keyframePercentage),
								x: parseInt(keyframeX),
								y: parseInt(keyframeY),
							});
						} else {
							throw new Error('Invalid animation keyframe');
						}
					}
				}

				await this.overlayRenderer.render(
					fileBuffer,
					id,
					width,
					height,
					x,
					y,
					animate,
					animationDuration,
					keyframes,
				);
				response.sendStatus(200);
			} catch (error) {
				response.status(400).send({ error: error.message });
			}
		});

		this.expressApp.use((_request: express.Request, response: express.Response) => {
			response.send(404);
		});
	}

	private handleSocketMessage() {
		this.socketServer.server.bindConnection((socket: ISocket) => {
			console.log('socket connected');
			socketHandleMessage(
				socket,
				this.fileSystem,
				this.fileDetailsProvider,
				this.nativeDriver,
				this.display,
				this.overlayRenderer,
			);
			socketHandleVideo(socket, this.videoPlayer);
			socketHandleCEC(socket, this.cecListener);
			socketHandleApplication(socket);
			socketHandleStorageUnitsChanged(socket, this.fileSystem);
			socketHandleSensors(socket, this.nativeDriver);
		});
	}
}
