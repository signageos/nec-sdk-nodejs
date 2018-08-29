import * as childProcess from "child_process";

export async function execChildProcess(command: string) {
	return await new Promise<string>((resolve: (stdout: string) => void, reject: (error: Error) => void) => {
		childProcess.exec(command, (error: Error, stdout: string, stderr: string) => {
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
