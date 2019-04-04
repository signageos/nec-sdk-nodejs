import * as childProcess from 'child_process';
import IServletRunner from '@signageos/front-display/es6/Servlet/IServletRunner';
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import IFileSystem from '../FileSystem/IFileSystem';

// TODO manage forked processes, add logic to be able to cancel them, etc.

export default class ServletRunner implements IServletRunner {

	constructor(private fileSystem: IFileSystem) {}

	public async run(entryPoint: IFilePath, env?: { [p: string]: any }): Promise<void> {
		const entryPointAbsolutePath = this.fileSystem.getAbsolutePath(entryPoint);
		childProcess.fork(entryPointAbsolutePath, [] as ReadonlyArray<string>, {
			env: env as NodeJS.ProcessEnv,
		});
	}
}
