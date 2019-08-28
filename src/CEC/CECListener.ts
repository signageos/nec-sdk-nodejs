import * as path from 'path';
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
import UnixSocketEventListener from '../UnixSocket/UnixSocketEventListener';
import Key from './Key';
import ICECListener from './ICECListener';
import { listenToCECKeypresses } from '../API/SystemAPI';
import IDisplay from '../Driver/Display/IDisplay';

const SOCKET_FILE_NAME = 'cec.sock';

export default class CECListener implements ICECListener {

	private unixSocketPath: string;
	private unixSocketEventListener: UnixSocketEventListener;
	private cecListenerChildProcess: ChildProcess | null = null;
	private eventEmitter: EventEmitter;

	constructor(private display: IDisplay, socketRootPath: string) {
		this.unixSocketPath = path.join(socketRootPath, SOCKET_FILE_NAME);
		this.unixSocketEventListener = new UnixSocketEventListener(this.unixSocketPath);
		this.eventEmitter = new EventEmitter();
		this.mapIndividualKeyEventsIntoSingleEvent();
	}

	public async listen() {
		await this.unixSocketEventListener.listen();
		this.startCecListenerChildProcess();
		await this.display.initCEC();
	}

	public async close() {
		console.log('closing CEC listener');
		await this.closeCecListenerChildProcess();
		await this.unixSocketEventListener.close();
	}

	public onKeypress(callback: (key: Key) => void) {
		this.eventEmitter.addListener('keypress', callback);
	}

	public removeListener(callback: (key: Key) => void): void {
		this.eventEmitter.removeListener('keypress', callback);
	}

	private mapIndividualKeyEventsIntoSingleEvent() {
		for (let index of Object.keys(Key)) {
			const key = Key[index as keyof typeof Key];
			if (typeof key === 'number') {
				this.unixSocketEventListener.addListener(key.toString(), () => {
					this.eventEmitter.emit('keypress', key);
				});
			}
		}
	}

	private startCecListenerChildProcess() {
		this.cecListenerChildProcess = listenToCECKeypresses(this.unixSocketPath);
		this.cecListenerChildProcess.once('close', (code: number, signal: string | null) => {
			console.warn('CEC process closed unexpectedly with code ' + code + (signal ? '; signal: ' + signal : ''));
			this.cecListenerChildProcess = null;
		});
		this.cecListenerChildProcess.once('error', (error: Error) => {
			console.error('CEC listener error', error);
			this.cecListenerChildProcess = null;
		});
	}

	private async closeCecListenerChildProcess() {
		if (this.cecListenerChildProcess) {
			this.cecListenerChildProcess.removeAllListeners();
			const closedPromise = new Promise<void>(async (resolve: () => void) => {
				this.cecListenerChildProcess!.once('close', () => {
					this.cecListenerChildProcess = null;
					resolve();
				});
			});
			this.cecListenerChildProcess.kill('SIGINT');
			setTimeout(
				() => {
					if (this.cecListenerChildProcess) {
						this.cecListenerChildProcess.kill('SIGKILL');
					}

				},
				2000,
			);
			await closedPromise;
			this.cecListenerChildProcess = null;
		}
	}
}
