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
