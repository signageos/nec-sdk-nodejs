import { WriteStream } from 'fs';
import * as Request from 'request';

export function downloadFile(
	file: WriteStream,
	uri: string,
	headers?: { [key: string]: string },
) {
	return new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
		const request = Request.get(uri, { headers });
		request.on('response', (response: Request.Response) => {
			if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
				response.pipe(file);
				response.on('end', resolve);
			} else {
				reject(new Error('File download failed with status code: ' + response.statusCode));
			}
		});
		request.on('error', (error: Error) => {
			reject(new Error('File download failed with status code: ' + error.message));
		});
	});
}
