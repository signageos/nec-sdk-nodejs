import * as childProcess from "child_process";
import * as Debug from 'debug';
const debug = Debug('@signageos/display-linux:API:apiCommand');

const SOS_COMMAND = 'signageos';

export function execApiCommand(
	namespace: string,
	command: string,
	args: string[] = [],
	execAsRoot: boolean = true,
	verbose: boolean = false,
) {
	return execCommand(SOS_COMMAND, [namespace, command, ...args], execAsRoot, verbose);
}

export function execGetApiVersion() {
	return execCommand(SOS_COMMAND, ['--version'], false, false);
}

export function spawnApiCommandChildProcess(
	namespace: string,
	command: string,
	args: string[] = [],
	spawnAsRoot: boolean = false,
	verbose: boolean = false,
) {
	const fullArgs: ReadonlyArray<string> = [namespace, command, ...args];
	return spawnChildProcess(SOS_COMMAND, fullArgs, spawnAsRoot, verbose);
}

function execCommand(
	command: string,
	args: string[],
	execAsRoot: boolean,
	verbose: boolean,
) {
	return new Promise<string>((resolve: (stdout: string) => void, reject: (error: Error) => void) => {
		const spawnedChildProcess = spawnChildProcess(command, args, execAsRoot, verbose);
		let stdout = '';
		spawnedChildProcess.stdout.on('data', (chunk: any) => stdout += chunk);
		spawnedChildProcess.once('close', (code: number) => {
			if (code === 0) {
				resolve(stdout);
			} else {
				reject(new Error(`command ${command} ${args.join(' ')} exited with code ${code}`));
			}
		});
	});
}

function spawnChildProcess(
	command: string,
	args: ReadonlyArray<string>,
	spawnAsRoot: boolean,
	verbose: boolean,
) {
	let fullCommand = [command, ...args];
	if (spawnAsRoot) {
		fullCommand = ['sudo', ...fullCommand];
	}
	const [commandName, ...commandArgs] = fullCommand;
	const spawnedChildProcess = childProcess.spawn(commandName, commandArgs);
	if (verbose) {
		spawnedChildProcess.stdout.on('data', (chunk: any) => console.log(fullCommand.join(' '), chunk.toString()));
		spawnedChildProcess.stderr.on('data', (chunk: any) => {
			if (verbose) {
				console.error(fullCommand.join(' '), chunk.toString());
			} else {
				debug(`spawnApiCommandChildProcess`, commandName, commandArgs, chunk.toString());
			}
		});
	}
	return spawnedChildProcess;
}
