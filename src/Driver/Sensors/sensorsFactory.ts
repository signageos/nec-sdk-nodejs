import NECPD from '@signageos/nec-sdk/dist/NECPD';
import { isNECDisplay } from '../../serverHelper';
import ISensors from './ISensors';
import NECSensors from './NECSensors';
import NotImplementedSensors from './NotImplementedSensors';

export async function createSensors(necPD: NECPD): Promise<ISensors> {
	try {
		if (await isNECDisplay(necPD)) {
			return new NECSensors(necPD);
		}
		return new NotImplementedSensors();
	} catch (e) {
		return new NotImplementedSensors();
	}
}
