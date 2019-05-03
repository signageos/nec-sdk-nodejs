import * as childProcess from 'child_process';
import IServletRunner from '@signageos/front-display/es6/Servlet/IServletRunner';
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import IFileSystem from '../FileSystem/IFileSystem';
import wait from '@signageos/lib/dist/Timer/wait';

// TODO manage forked processes, add logic to be able to cancel them, etc.

export default class ServletRunner implements IServletRunner {

	constructor(private fileSystem: IFileSystem) {}

	public async run(entryPoint: IFilePath, env?: { [p: string]: any }): Promise<void> {
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

			const TIMEOUT_BEFORE_RESTART = 1e3;
			await wait(TIMEOUT_BEFORE_RESTART);
			await this.run(entryPoint, env);
		});
		servletProcess.on('error', (error: Error) => {
			console.error('servlet error', error);
		});
	}
}
