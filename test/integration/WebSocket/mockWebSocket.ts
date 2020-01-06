import { EventEmitter } from 'events';
import { ISocketServer, ISocket as ISocketConnection } from '@signageos/lib/dist/WebSocket/socketServer';
import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';

class MockSocketConnection implements ISocketConnection {

	private resolveDisconnectedPromise: ((code: number, reason?: string) => void) | null = null;

	constructor(
		private eventEmitter: EventEmitter,
	) {}

	public getDisconnectedPromise(): Promise<{ code: number; reason?: string }> {
		return new Promise((resolve: (result: { code: number, reason?: string }) => void) => {
			this.resolveDisconnectedPromise = (code: number, reason?: string) => resolve({ code, reason });
		});
	}

	public bindError(_listener: (error: Error) => void) {
		// do nothing
		return () => undefined;
	}

	public bindMessage<TMessage>(event: string, listener: (payload: TMessage) => void) {
		this.eventEmitter.on('receive_message', (message: { event: string, payload: TMessage }) => {
			if (message.event === event) {
				listener(message.payload);
			}
		});
		return () => undefined;
	}

	public getMessagePromise<TMessage>(_event: string): Promise<TMessage> {
		// TODO
		return new Promise<TMessage>(() => {/* do nothing */});
	}

	public async sendMessage(event: string, payload: any): Promise<void> {
		this.eventEmitter.emit('send_message', { event, payload });
	}

	public sendMessageExpectingResponse(_event: string, _payload: any): Promise<void> {
		// TODO
		return new Promise<void>(() => {/* do nothing */});
	}

	public async disconnect(code?: number, reason?: string): Promise<void> {
		if (this.resolveDisconnectedPromise) {
			this.resolveDisconnectedPromise(code!, reason);
		}
	}

	public drain(): void {
		// do nothing
	}
}

export class MockWebSocketServer implements ISocketServer {

	private eventEmitter: EventEmitter;

	constructor() {
		this.eventEmitter = new EventEmitter();
	}

	public bindConnection(listener: (socket: ISocketConnection) => void): void {
		listener(new MockSocketConnection(this.eventEmitter));
	}

	public simulateReceivedMessage(event: string, payload: any) {
		this.eventEmitter.emit('receive_message', { event, payload });
	}

	public onSendMessage(listener: (message: { event: string, payload: any }) => void) {
		this.eventEmitter.on('send_message', listener);
	}
}

export class MockWebSocketClient implements ISocket {

	private eventEmitter: EventEmitter;

	constructor() {
		this.eventEmitter = new EventEmitter();
	}

	public on(event: string, listener: (message: any) => void): void {
		this.eventEmitter.addListener('receive_message', (message: { event: string, message: any }) => {
			if (message.event === event) {
				listener(message.message);
			}
		});
	}

	public once(event: string, listener: (message: any) => void): void {
		const internalListener = (message: { event: string, message: any }) => {
			if (message.event === event) {
				listener(message.message);
				this.eventEmitter.removeListener('receive_message', internalListener);
			}
		};
		this.eventEmitter.addListener('receive_message', internalListener);
	}

	public emit(event: string, message: any, _callback?: () => void): void {
		this.eventEmitter.emit('send_message', { event, message });
	}

	public removeListener(_event: string, _listener: (message: any) => void): void {
		// TODO
	}

	public removeAllListeners(): void {
		this.eventEmitter.removeAllListeners('receive_message');
	}

	public close(): void {
		// do nothing
	}

	public simulateReciveMessage(event: string, message: any) {
		this.eventEmitter.emit('receive_message', { event, message });
	}

	public onSendMessage(listener: (message: { event: string, message: any }) => void) {
		this.eventEmitter.addListener('send_message', listener);
	}
}

export function createMockSocketServerClientPair() {
	const socketServer = new MockWebSocketServer();
	const socketClient = new MockWebSocketClient();
	socketServer.onSendMessage((message: { event: string, payload: any }) => {
		socketClient.simulateReciveMessage(message.event, message.payload);
	});
	socketClient.onSendMessage((message: { event: string, message: any }) => {
		socketServer.simulateReceivedMessage(message.event, message.message);
	});
	return { socketServer, socketClient };
}
