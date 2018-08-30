import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import handleMessage, { InvalidMessageError } from './handleMessage';
import IFileSystem from '../FileSystem/IFileSystem';

export default class BridgeServer {

	private readonly expressApp: express.Application;
	private readonly httpServer: http.Server;

	constructor(private port: number, private fileSystem: IFileSystem, private nativeDriver: IBasicDriver) {
		this.expressApp = express();
		this.httpServer = http.createServer(this.expressApp);
		this.defineRoutes();
	}

	public async start() {
		return new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			this.httpServer.listen(this.port, (error: any) => {
				if (error) {
					console.error('failed to start BridgeServer', error);
					reject(new Error('Failed to start BridgeServer'));
				} else {
					console.info('BridgeServer started');
					resolve();
				}
			});
		});

	}

	private defineRoutes() {
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
}
