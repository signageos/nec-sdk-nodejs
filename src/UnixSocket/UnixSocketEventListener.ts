import { EventEmitter } from "events";
import { createServer, Socket } from "net";
import IUnixSocketEventListener from './IUnixSocketEventListener';

class UnixSocketEventListener extends EventEmitter implements IUnixSocketEventListener {

	constructor(private socketPath: string) {
		super();
	}

	public getSocketPath() {
		return this.socketPath;
	}

	public listen() {
		return new Promise<void>((resolve: () => void) => {
			const server = createServer((socket: Socket) => {
				socket.on('data', (data: Buffer) => {
					const event = data.toString().replace(/\0/g, '');
					this.emit(event);
				});
				socket.on('error', (error: Error) => {
					console.error('Video socket server error', error);
				});
			});
			server.listen(this.socketPath, resolve);
		});
	}
}

export default UnixSocketEventListener;
