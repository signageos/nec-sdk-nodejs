import IMonitors from '@signageos/front-display/es6/NativeDevice/IMonitors';
import NotImplementedMonitors from '@signageos/front-display/es6/Monitors/NotImplementedMonitors';
import NECPD from '@signageos/nec-sdk/dist/NECPD';
import { isNECDisplay } from '../../serverHelper';
import NECMonitors from './NECMonitors';

export async function createMonitors(necPD: NECPD): Promise<IMonitors> {
	try {
		if (await isNECDisplay(necPD)) {
			return new NECMonitors(necPD);
		}
		return new NotImplementedMonitors();
	} catch (e) {
		return new NotImplementedMonitors();
	}
}
