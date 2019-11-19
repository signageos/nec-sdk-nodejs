import IMonitors from '@signageos/front-display/es6/NativeDevice/IMonitors';
import NotImplementedMonitors from '@signageos/front-display/es6/Monitors/NotImplementedMonitors';
import { INECAPI } from '../../API/NECAPI';
import { isNECDisplay } from '../../helper';
import NECMonitors from './NECMonitors';

export async function createMonitors(necAPI: INECAPI): Promise<IMonitors> {
	try {
		if (await isNECDisplay(necAPI)) {
			return new NECMonitors(necAPI);
		}
		return new NotImplementedMonitors();
	} catch (e) {
		return new NotImplementedMonitors();
	}
}
