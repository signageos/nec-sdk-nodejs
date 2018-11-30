export class BridgeRequestFailedError {}

export default class BridgeClient {

	constructor(
		private serverUri: string,
	) {}

	public async invoke<TMessage extends { type: string }, TResult>(message: TMessage): Promise<TResult> {
		const response = await fetch(
			this.serverUri + '/message',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(message),
			},
		);

		if (!response.ok) {
			throw new BridgeRequestFailedError();
		}

		return await response.json();
	}

	public async uploadOverlay(
		fileBlob: Blob,
		id: string,
		appletUid: string,
		width: number,
		height: number,
		x: number,
		y: number,
		horizontalTranslation?: number,
		verticalTranslation?: number,
		maxHorizontalOffset?: number,
		maxVerticalOffset?: number,
	) {
		const params: { [key: string]: any } = {
			id, appletUid, width, height, x, y, horizontalTranslation, verticalTranslation, maxHorizontalOffset, maxVerticalOffset
		};
		const paramsString = Object.keys(params)
			.filter((key: string) => typeof params[key] !== 'undefined')
			.map((key: string) => `${key}=${params[key]}`)
			.join('&');

		const response = await fetch(
			this.serverUri + '/overlay?' + paramsString,
			{
				method: 'POST',
				body: fileBlob,
			},
		);

		if (!response.ok) {
			throw new Error('Failed to upload overlay image with status code ' + response.status);
		}
	}
}
