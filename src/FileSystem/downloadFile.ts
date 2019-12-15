import * as childProcess from 'child_process';
import * as Debug from 'debug';

const debug = Debug('@signageos/display-linux:FileSystem:downloadFile');

export function downloadFile(
	destination: string,
	uri: string,
	headers: { [key: string]: string } = {},
) {
	const headerArgs: string[] = [];
	for (let header of Object.keys(headers)) {
		headerArgs.push('-H');
		headerArgs.push(`${header}: ${headers[header]}`);
	}

	return new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
		const process = childProcess.spawn('curl', ['--fail', '-o', destination, ...headerArgs, uri]);
		process.stdout.on('data', (chunk: any) => debug(chunk.toString()));
		process.stderr.on('data', (chunk: any) => debug(chunk.toString()));
		process.once('close', (code: number) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error('File download failed with exit code: ' + code));
			}
		});
	});
}
