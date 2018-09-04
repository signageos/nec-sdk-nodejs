import * as url from 'url';
import * as http from 'http';
import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import IVideoPlayer from '@signageos/front-display/es6/Video/IVideoPlayer';
import { ISocketServerWrapper, ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import { createWsSocketServer } from '@signageos/lib/dist/WebSocket/wsServerFactory';
import handleMessage, { InvalidMessageError } from './handleMessage';
import handleSocket from './handleSocket';
import IFileSystem from '../FileSystem/IFileSystem';

export default class BridgeServer {

	private readonly expressApp: express.Application;
	private readonly httpServer: http.Server;
	private readonly socketServer: ISocketServerWrapper;

	constructor(
		private serverUrl: string,
		private fileSystem: IFileSystem,
		private nativeDriver: IBasicDriver,
		private videoPlayer: IVideoPlayer,
	) {
		this.expressApp = express();
		this.httpServer = http.createServer(this.expressApp);
		this.socketServer = createWsSocketServer(this.httpServer);
		this.defineHttpRoutes();
		this.handleSocketMessage();
	}

	public async start() {
		await new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			const port = url.parse(this.serverUrl).port;
			this.httpServer.listen(port, (error: any) => {
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
				const responseMessage = await handleMessage(this.fileSystem, this.nativeDriver, request.body);
				response.send(responseMessage);
			} catch (error) {
				if (error instanceof InvalidMessageError) {
					response.sendStatus(400);
				} else {
					response.sendStatus(500);
					throw error;
				}
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
