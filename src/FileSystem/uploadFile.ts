import { ReadStream } from 'fs';
import * as request from 'request-promise-native';

export async function uploadFile(
	file: ReadStream,
	formKey: string,
	uri: string,
	headers?: { [key: string]: string },
) {
	try {
		const response = await request(uri, {
			method: 'POST',
			resolveWithFullResponse: true,
			headers,
			formData: {
				[formKey]: file,
			},
		});

		return response.body;
	} catch (error) {
		throw new Error('File upload failed with status code ' + error.statusCode);
	}
}
