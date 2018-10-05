import * as childProcess from "child_process";

// TODO : maybe log everything somewhere in the cloud somehow

export async function execApiCommand(namespace: string, command: string, args: string = '') {
	return await new Promise<string>((resolve: (stdout: string) => void, reject: (error: Error) => void) => {
		const fullCommand = `sudo signageos ${namespace} ${command} ${args}`;
		childProcess.exec(fullCommand, (error: Error, stdout: string, stderr: string) => {
			if (stdout) {
				console.log(fullCommand, stdout);
			}

			if (stderr) {
				console.error(fullCommand, stderr);
			}

			if (error) {
				reject(error);
			} else {
				resolve(stdout);
			}
		});
	});
}

export function spawnApiCommandChildProcess(namespace: string, command: string, args: string[] = []) {
	const fullCommand = ['signageos', namespace, command, ...args];
	const spawnedChildProcess = childProcess.spawn('sudo', fullCommand as ReadonlyArray<string>);
	spawnedChildProcess.stdout.on('data', (chunk: any) => console.log(fullCommand.join(' '), chunk.toString()));
	spawnedChildProcess.stderr.on('data', (chunk: any) => console.error(fullCommand.join(' '), chunk.toString()));
	return spawnedChildProcess;
}
