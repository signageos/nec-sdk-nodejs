import { EventEmitter } from 'events';
import IServerVideo from '../../../../src/Driver/Video/IServerVideo';
import { IVideoArguments } from '../../../../src/Driver/Video/ServerVideo';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';

enum State {
	IDLE,
	PLAYING
}

class MockServerVideo implements IServerVideo {

	private state: State = State.IDLE;
	private videoArguments: IVideoArguments | null = null;
	private eventEmitter: EventEmitter;

	constructor() {
		this.eventEmitter = new EventEmitter();
	}

	public getVideoArguments(): IVideoArguments | null {
		return this.videoArguments;
	}

	public async initialize(): Promise<void> {
		// do nothing
	}

	public async prepare(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		_orientation: Orientation,
		_isStream: boolean,
	): Promise<void> {
		this.videoArguments = { uri, x, y, width, height };
	}

	public async play(): Promise<void> {
		if (!this.isPrepared()) {
			throw new Error('Trying to play video that\'s not prepared');
		}
		this.state = State.PLAYING;
	}

	public async stop(): Promise<void> {
		this.state = State.IDLE;
	}

	public isIdle(): boolean {
		return this.state === State.IDLE;
	}

	public isPlaying(): boolean {
		return this.state === State.PLAYING;
	}

	public isPaused(): boolean {
		return false;
	}

	public isPrepared(): boolean {
		return !!this.videoArguments;
	}

	public addEventListener(event: string, callback: () => void): void {
		this.eventEmitter.addListener(event, callback);
	}

	public removeAllListeners(): void {
		this.eventEmitter.removeAllListeners();
	}

	public emitEvent(event: string, ...args: any[]) {
		this.eventEmitter.emit(event, ...args);
	}
}

export default MockServerVideo;
