import BridgeClient from './Bridge/BridgeClient';
import { handleMutations } from './Overlay/overlayMutationsHandler';
const parameters = require('../config/basic_parameters');

let observer: MutationObserver | undefined = undefined;

(window as any).enableOverlay = function () {
	const bridge = new BridgeClient(parameters.server.bridge_url);
	observer = new MutationObserver(async (mutations: MutationRecord[]) => {
		try {
			await handleMutations(window, bridge, mutations);
		} catch (error) {
			console.error('error while handling mutations', error);
		}
	});
	observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
};
