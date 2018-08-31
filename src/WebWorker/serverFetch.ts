import * as request from 'request-promise-native';
import { FetchError } from '@signageos/front-display/es6/WebWorker/FetchError';

export async function fetch(url: string): Promise<any> {
	const response = await request(url, {
		method: 'GET',
		simple: false,
		resolveWithFullResponse: true,
	});

	if (response.statusCode === 200) {
		return JSON.parse(response.body);
	}

	let parsedBody: any;
	try {
		parsedBody = JSON.parse(response.body);
	} catch (error) {
		parsedBody = error.response.body;
	}

	throw new FetchError(
		'Fetch failed, status code: ' + response.statusCode,
		{ status: response.statusCode } as any,
		parsedBody,
	);

	return JSON.parse(response.body);
}
