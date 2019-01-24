interface IUnixSocketEventListener {
	getSocketPath(): string;
	listen(): Promise<void>;
	close(): Promise<void>;
	once(event: string, listener: (...args: any[]) => void): void;
	on(event: string, listener: (...args: any[]) => void): void;
	removeAllListeners(): void;
}

export default IUnixSocketEventListener;
