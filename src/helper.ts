import { INECAPI } from './API/NECAPI';

const parameters = require('../config/parameters');

export function getAutoVerification(): { organizationUid: string } | undefined {
	const isOpen = parameters.bundledApplet !== null;
	if (isOpen) {
		if (!parameters.autoVerification || !parameters.autoVerification.organizationUid) {
			throw new Error('sOS Open requires organization uid to be set during build.'); // TODO add more info, link, etc.
		}
		return {
			organizationUid: parameters.autoVerification.organizationUid,
		};
	}

	return undefined;
}

let isNEC: boolean | null = null;
export async function isNECDisplay(necAPI: INECAPI): Promise<boolean> {
	if (isNEC === null) {
		isNEC = await necAPI.isNEC();
	}
	return isNEC;
}
