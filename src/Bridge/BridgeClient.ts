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
		width: number,
		height: number,
		x: number,
		y: number,
		animation?: {
			duration: number;
			keyframes: {
				percentage: number;
				rectangle: {
					x: number;
					y: number;
				};
			}[];
		},
	) {
		const params: { [key: string]: any } = { id, width, height, x, y };
		if (animation && animation.keyframes.length > 1) {
			params.animDuration = animation.duration;
			params.animKFCount = animation.keyframes.length;
			for (let i = 0; i < animation.keyframes.length; i++) {
				params['animKF' + i + '_percent'] = animation.keyframes[i].percentage;
				params['animKF' + i + '_x'] = animation.keyframes[i].rectangle.x;
				params['animKF' + i + '_y'] = animation.keyframes[i].rectangle.y;
			}
		}

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
