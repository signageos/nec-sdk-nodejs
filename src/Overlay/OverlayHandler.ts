import BridgeClient from '../Bridge/BridgeClient';
import * as OverlayBridgeMessage from '../Bridge/bridgeOverlayMessages';

class OverlayHandler {

	constructor(
		private window: Window,
		private frontAppletPrefix: string,
		private bridge: BridgeClient,
	) {
		this.listenToMessages();
	}

	public async clearAll() {
		await this.bridge.invoke<OverlayBridgeMessage.HideAll, {}>({
			type: OverlayBridgeMessage.HideAll,
		});
	}

	private listenToMessages() {
		this.window.addEventListener('message', async (event: MessageEvent) => {
			if (this.isValidMessage(event)) {
				switch (event.data.type) {
					case this.frontAppletPrefix + '_api.ready':
						this.sendMessageInjectOverlayHandlingScript(event.source as Window);
						break;

					default:
				}
			}
		});
	}

	private isValidMessage(event: MessageEvent) {
		return event.data && event.data.type && (event.source as Window).window;
	}

	private sendMessageInjectOverlayHandlingScript(appletWindow: Window) {
		appletWindow.postMessage(
			{
				type: this.frontAppletPrefix + '.assets.load_js',
				src: (this.window as any).origin + '/overlay.js',
			},
			'*',
		);
	}
}

export default OverlayHandler;
