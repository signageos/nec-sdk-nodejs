import Key from './Key';

interface ICECListener {
	listen(): Promise<void>;
	onKeypress(callback: (key: Key) => void): void;
	removeListener(callback: (key: Key) => void): void;
}

export default ICECListener;
