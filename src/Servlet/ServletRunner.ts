import * as childProcess from 'child_process';
import IServletRunner from '@signageos/front-display/es6/Servlet/IServletRunner';
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import IFileSystem from '../FileSystem/IFileSystem';
import wait from '@signageos/lib/dist/Timer/wait';
import { generateUniqueHash } from '@signageos/lib/dist/Hash/generator';

export default class ServletRunner implements IServletRunner {

	private closed: boolean = false;
	private processes: { [key: string]: childProcess.ChildProcess } = {};

	constructor(private fileSystem: IFileSystem) {}

	public async run(entryPoint: IFilePath, env?: { [p: string]: any }): Promise<void> {
		if (this.closed) {
			throw new Error('Can\'t run a server, servlet runner has been closed');
		}

		const uniqueKey = generateUniqueHash(10);
		const entryPointAbsolutePath = this.fileSystem.getAbsolutePath(entryPoint);
		const servletProcess = childProcess.fork(entryPointAbsolutePath, [] as ReadonlyArray<string>, {
			env: env as NodeJS.ProcessEnv,
		});
		servletProcess.once('close', async (code: number, signal: string | null) => {
			if (signal) {
				console.warn(`servlet process has exited with code ${code} after receiving signal ${signal}`);
			} else {
				console.warn(`servlet process has exited with code ${code}`);
			}

			delete this.processes[uniqueKey];

			if (!this.closed) {
				const TIMEOUT_BEFORE_RESTART = 1e3;
				await wait(TIMEOUT_BEFORE_RESTART);
				await this.run(entryPoint, env);
			}
		});
		servletProcess.on('error', (error: Error) => {
			console.error('servlet error', error);
			delete this.processes[uniqueKey];
		});
		this.processes[uniqueKey] = servletProcess;
	}

	public getRunningCount() {
		return Object.keys(this.processes).length;
	}

	public async closeAll(): Promise<void> {
		this.closed = true;
		for (let key of Object.keys(this.processes)) {
			this.processes[key].kill();
		}
	}
}
