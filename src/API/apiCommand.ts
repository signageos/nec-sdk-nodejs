import * as childProcess from "child_process";

export function execApiCommand(
	namespace: string,
	command: string,
	args: string[] = [],
	execAsRoot: boolean = true,
	verbose: boolean = false,
) {
	return new Promise<string>((resolve: (stdout: string) => void, reject: (error: Error) => void) => {
		const spawnedChildProcess = spawnApiCommandChildProcess(namespace, command, args, execAsRoot, verbose);
		let stdout = '';
		spawnedChildProcess.stdout.on('data', (chunk: any) => stdout += chunk);
		spawnedChildProcess.once('close', (code: number) => {
			if (code === 0) {
				resolve(stdout);
			} else {
				reject(new Error(`command ${namespace} ${command} exited with code ${code}`));
			}
		});
	});
}

export function spawnApiCommandChildProcess(
	namespace: string,
	command: string,
	args: string[] = [],
	spawnAsRoot: boolean = false,
	verbose: boolean = false,
) {
	let fullCommand = ['signageos', namespace, command, ...args];
	if (spawnAsRoot) {
		fullCommand = ['sudo', ...fullCommand];
	}

	const [commandName, ...commandArgs] = fullCommand;
	const spawnedChildProcess = childProcess.spawn(commandName, commandArgs as ReadonlyArray<string>);
	if (verbose) {
		spawnedChildProcess.stdout.on('data', (chunk: any) => console.log(fullCommand.join(' '), chunk.toString()));
		spawnedChildProcess.stderr.on('data', (chunk: any) => console.error(fullCommand.join(' '), chunk.toString()));
	}
	return spawnedChildProcess;
}
