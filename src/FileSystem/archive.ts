import * as childProcess from "child_process";

export function unzip(source: string, destination: string) {
	return new Promise<string>((resolve: (stdout: string) => void, reject: (error: Error) => void) => {
		const fullCommand = `unzip -o ${source} -d ${destination}`;
		childProcess.exec(fullCommand, (error: Error, stdout: string, stderr: string) => {
			if (stdout) {
				console.debug(fullCommand, stdout);
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
