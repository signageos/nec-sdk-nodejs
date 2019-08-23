import IDisplay from './IDisplay';
import ISystemSettings from '../../SystemSettings/ISystemSettings';
import NECDisplay from './NECDisplay';
import EmulatedDisplay from './EmulatedDisplay';
import { INECAPI } from '../../API/NECAPI';

export async function createDisplay(necAPI: INECAPI, systemSettings: ISystemSettings): Promise<IDisplay> {
	try {
		const isNECDisplay = await necAPI.isNEC();
		if (isNECDisplay) {
			return new NECDisplay(necAPI);
		}
		return new EmulatedDisplay(systemSettings);
	} catch (error) {
		return new EmulatedDisplay(systemSettings); // if NEC API fails or isn't defined in older FW
	}
}
