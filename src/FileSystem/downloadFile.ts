import { WriteStream } from 'fs';
import * as request from 'request';

export async function downloadFile(
	file: WriteStream,
	uri: string,
	headers?: { [key: string]: string },
) {
	return new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
		const pendingRequest = request.get(uri, { headers });
		pendingRequest.on('response', (response: request.Response) => {
			if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
				response.addListener('data', (chunk: any) => {
					file.write(chunk, (error: any) => {
						if (error) {
							reject(new Error('Failed write file while downloading'));
						}
					});
				});

				response.addListener('end', () => {
					file.end(resolve);
				});
			} else {
				reject(new Error('File download failed with status code: ' + response.statusCode));
			}
		});
		pendingRequest.on('error', (error: Error) => {
			reject(new Error('File download failed with status code: ' + error.message));
		});
	});
}
