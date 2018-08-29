import * as childProcess from 'child_process';

export async function reboot() {
	await new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
		console.log('reboot device');
		childProcess.exec('sudo /sbin/shutdown -r now', (error: Error, stdout: string, stderr: string) => {
			if (stdout) {
				console.log(stdout);
			}
			if (stderr) {
				console.error(stderr);
			}

			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
}
