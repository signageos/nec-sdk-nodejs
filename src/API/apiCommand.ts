import * as childProcess from "child_process";
import * as Debug from 'debug';
const debug = Debug('@signageos/display-linux:API:apiCommand');

const SOS_COMMAND = 'signageos';

export interface IOptions {
	asRoot?: boolean;
	verbose?: boolean;
}

export function execApiCommand(
	namespace: string,
	command: string,
	args: string[] = [],
	options: IOptions = {},
) {
	return execCommand(SOS_COMMAND, [namespace, command, ...args], options);
}

export function execGetApiVersion() {
	return execCommand(SOS_COMMAND, ['--version']);
}

export function spawnApiCommandChildProcess(
	namespace: string,
	command: string,
	args: string[] = [],
	options: IOptions = {},
) {
	const fullArgs: ReadonlyArray<string> = [namespace, command, ...args];
	return spawnChildProcess(SOS_COMMAND, fullArgs, options);
}

function execCommand(
	command: string,
	args: string[],
	options: IOptions = {},
) {
	return new Promise<string>((resolve: (stdout: string) => void, reject: (error: Error) => void) => {
		const spawnedChildProcess = spawnChildProcess(command, args, options);
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
	options: IOptions = {},
) {
	const DEFAULT_OPTIONS = { asRoot: false, verbose: false };
	const fullOptions = { ...DEFAULT_OPTIONS, ...options };
	let fullCommand = [command, ...args];
	if (fullOptions.asRoot) {
		fullCommand = ['sudo', ...fullCommand];
	}
	const [commandName, ...commandArgs] = fullCommand;
	const spawnedChildProcess = childProcess.spawn(commandName, commandArgs);
	if (fullOptions.verbose) {
		spawnedChildProcess.stdout.on('data', (chunk: any) => console.log(fullCommand.join(' '), chunk.toString()));
		spawnedChildProcess.stderr.on('data', (chunk: any) => {
			if (fullOptions.verbose) {
				console.error(fullCommand.join(' '), chunk.toString());
			} else {
				debug(`spawnApiCommandChildProcess`, commandName, commandArgs, chunk.toString());
			}
		});
	}
	return spawnedChildProcess;
}