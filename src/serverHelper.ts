import NECPD from '@signageos/nec-sdk/dist/NECPD';
import { isNEC } from './API/NECAPI';

let isNECCached: boolean | null = null;
export async function isNECDisplay(necPD: NECPD): Promise<boolean> {
	if (isNECCached === null) {
		if (await isNEC()) {
			try {
				await necPD.getModelName(); // only consider NEC if communicating
				isNECCached = true;
			} catch (error) {
				isNECCached = false;
			}
		} else {
			isNECCached = false;
		}
	}
	return isNECCached;
}
