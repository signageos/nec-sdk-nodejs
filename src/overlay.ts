import BridgeClient from './Bridge/BridgeClient';
import { handleMutations } from './Overlay/overlayMutationsHandler';
const parameters = require('../config/basic_parameters');

let observer: MutationObserver | undefined = undefined;

(window as any).enableOverlay = function () {
	const bridge = new BridgeClient(parameters.server.bridge_url);
	observer = new MutationObserver((mutations: MutationRecord[]) => handleMutations(window, bridge, mutations));
	observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
};
