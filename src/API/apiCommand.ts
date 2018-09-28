import * as childProcess from "child_process";

export async function execApiCommand(namespace: string, command: string, args: string = '') {
	return await new Promise<string>((resolve: (stdout: string) => void, reject: (error: Error) => void) => {
		const fullCommand = `sudo signageos ${namespace} ${command} ${args}`;
		childProcess.exec(fullCommand, (error: Error, stdout: string, stderr: string) => {
			if (stderr) {
				console.error(stderr);
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
	return childProcess.spawn('sudo', ['signageos', namespace, command, ...args] as ReadonlyArray<string>);
}
