import NECPD from '@signageos/nec-sdk/dist/NECPD';
import { isNEC } from './API/NECAPI';

let isNECCached: boolean | null = null;
export async function isNECDisplay(necPD: NECPD): Promise<boolean> {
	if (isNECCached === null) {
		if (await isNEC()) {
			isNECCached = await necPD.isAlive(); // only consider NEC if communicating
		} else {
			isNECCached = false;
		}
	}
	return isNECCached;
}
