import * as url from 'url';
import * as http from 'http';
import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import { ISocketServerWrapper, ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import { createWsSocketServer } from '@signageos/lib/dist/WebSocket/wsServerFactory';
import handleMessage, { InvalidMessageError, ResourceNotFound } from './handleMessage';
import handleSocket from './handleSocket';
import IFileSystem from '../FileSystem/IFileSystem';
import IServerVideoPlayer from '../Driver/Video/IServerVideoPlayer';
import OverlayRenderer from '../Overlay/OverlayRenderer';

export default class BridgeServer {

	private readonly expressApp: express.Application;
	private readonly httpServer: http.Server;
	private readonly socketServer: ISocketServerWrapper;

	constructor(
		private serverUrl: string,
		private fileSystem: IFileSystem,
		private nativeDriver: IBasicDriver & IManagementDriver,
		private videoPlayer: IServerVideoPlayer,
		private overlayRenderer: OverlayRenderer,
	) {
		this.expressApp = express();
		this.httpServer = http.createServer(this.expressApp);
		this.socketServer = createWsSocketServer(this.httpServer);
		this.defineHttpRoutes();
		this.handleSocketMessage();
	}

	public async start() {
		await this.videoPlayer.initialize();
		await new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			const serverUrl = url.parse(this.serverUrl);
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
	}

	private defineHttpRoutes() {
		this.expressApp.use(cors());
		this.expressApp.use(bodyParser.json());
		this.expressApp.post('/message', async (request: express.Request, response: express.Response) => {
			try {
				const responseMessage = await handleMessage(this.fileSystem, this.nativeDriver, this.overlayRenderer, request.body);
				response.send(responseMessage);
			} catch (error) {
				if (error instanceof InvalidMessageError) {
					response.sendStatus(400);
				} else if (error instanceof ResourceNotFound) {
					response.sendStatus(404);
				} else {
					response.sendStatus(500);
					throw error;
				}
			}
		});

		const rawBody = bodyParser.raw({ inflate: true, limit: '100mb', type: '*/*' });
		this.expressApp.post('/overlay', rawBody, async (request: express.Request, response: express.Response) => {
			const {
				id, appletUid, width, height, x, y, horizontalTranslation, verticalTranslation, maxHorizontalOffset, maxVerticalOffset,
			} = request.query;
			const fileBuffer = request.body;
			try {
				await this.overlayRenderer.render(
					fileBuffer,
					id,
					appletUid,
					width,
					height,
					x,
					y,
					horizontalTranslation,
					verticalTranslation,
					maxHorizontalOffset,
					maxVerticalOffset,
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
		this.socketServer.server.on('connection', (socket: ISocket) => {
			handleSocket(socket, this.videoPlayer);
		});
	}
}
