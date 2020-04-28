import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import { ISystemAPI } from '../API/SystemAPI';
import { BrowserSetACLWhitelist, BrowserSetACLBlacklist, BrowserClearACL } from './bridgeBrowserMessages';
import { MessageType } from './BridgeClient';
import IBridgeMessage from './IBridgeMessage';
import * as Debug from 'debug';
const debug = Debug('@signageos/display-linux:Bridge:socketHandleBrowser');

export default function socketHandleBrowser(
	socket: ISocket,
	systemAPI: ISystemAPI,
) {
	socket.bindMessage('message.' + MessageType.BROWSER, async (message: IBridgeMessage<any>) => {
		debug('browser message received', message);
		try {
			await handleBrowserMessage(systemAPI, message.message);
			debug('browser message success', message);
			await socket.sendMessage(message.invocationUid, { success: true, response: {} });
		} catch (error) {
			debug('browser message error', message);
			await socket.sendMessage(message.invocationUid, { success: false });
		}
	});
}

async function handleBrowserMessage(
	systemAPI: ISystemAPI,
	message: BrowserSetACLWhitelist | BrowserSetACLBlacklist | BrowserClearACL,
) {
	switch (message.type) {
		case BrowserSetACLWhitelist:
			await systemAPI.setWebACLWhitelist(message.acl);
			return {};
		case BrowserSetACLBlacklist:
			await systemAPI.setWebACLBlacklist(message.acl);
			return {};
		case BrowserClearACL:
			await systemAPI.clearWebACL();
			return {};
		default:
			throw new Error('invalid browser message');
	}
}
