import { INECAPI } from '../../API/NECAPI';
import ISensors from './ISensors';
import NECSensors from './NECSensors';
import NotImplementedSensors from './NotImplementedSensors';

export async function createSensors(necAPI: INECAPI): Promise<ISensors> {
	try {
		if (await necAPI.isNEC()) {
			return new NECSensors(necAPI);
		}
		return new NotImplementedSensors();
	} catch (e) {
		return new NotImplementedSensors();
	}
}
