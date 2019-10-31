import BridgeClient from './Bridge/BridgeClient';
import { handleMutations } from './Overlay/overlayMutationsHandler';
import { createAutoReconnectingSocket } from '@signageos/lib/dist/WebSocket/Client/WS/createWSSocket';
const parameters = require('../config/basic_parameters');

let observer: MutationObserver | undefined = undefined;

(window as any).sos.overlay = {
	enable: function () {
		const socketClient = createAutoReconnectingSocket(
			parameters.server.bridge_url,
			() => console.log('Bridge socket connected'),
			() => console.log('Bridge socket disconnected'),
			(error: any) => console.error('Bridge socket error', error),
		);
		const bridge = new BridgeClient(parameters.server.bridge_url, socketClient);
		observer = new MutationObserver(async (mutations: MutationRecord[]) => {
			try {
				await handleMutations(window, bridge, mutations);
			} catch (error) {
				console.error('error while handling mutations', error);
			}
		});
		observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
	},
};
