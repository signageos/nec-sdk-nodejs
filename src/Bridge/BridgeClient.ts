export default class BridgeClient {

	constructor(private serverUri: string) {}

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
			throw new Error('bridge invoke failed with status code ' + response.status);
		}

		return await response.json();
	}
}
