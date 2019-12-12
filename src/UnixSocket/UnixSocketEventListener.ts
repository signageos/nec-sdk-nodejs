import { EventEmitter } from "events";
import { createServer, Server, Socket } from "net";
import * as path from 'path';
import * as fs from 'fs-extra';
import IUnixSocketEventListener from './IUnixSocketEventListener';

class UnixSocketEventListener extends EventEmitter implements IUnixSocketEventListener {

	private server: Server;

	constructor(private socketPath: string) {
		super();
		this.server = this.createServer();
	}

	public getSocketPath() {
		return this.socketPath;
	}

	public async listen() {
		const socketDirectory = path.dirname(this.socketPath);
		await fs.ensureDir(socketDirectory);
		await new Promise<void>((resolve: () => void) => {
			this.server.listen(this.socketPath, resolve);
		});
	}

	public async close() {
		await new Promise<void>((resolve: () => void) => {
			this.server.close(resolve);
		});
		try {
			await fs.remove(this.socketPath);
		} catch (error) {
			console.warn('Error while deleting socket file during closing unix socket event listener', error);
		}
	}

	private createServer() {
		return createServer((socket: Socket) => {
			socket.on('data', (data: Buffer) => {
				const event = data.toString().replace(/\0/g, '');
				this.emit(event);
			});
			socket.on('error', (error: Error) => {
				console.error('Video socket server error', error);
			});
		});
	}
}

export default UnixSocketEventListener;
