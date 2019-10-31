import IDisplay from './IDisplay';
import ISystemSettings from '../../SystemSettings/ISystemSettings';
import NECDisplay from './NECDisplay';
import EmulatedDisplay from './EmulatedDisplay';
import { INECAPI } from '../../API/NECAPI';
import { ISystemAPI } from '../../API/SystemAPI';

export async function createDisplay(necAPI: INECAPI, systemSettings: ISystemSettings, systemAPI: ISystemAPI): Promise<IDisplay> {
	try {
		const isNECDisplay = await necAPI.isNEC();
		if (isNECDisplay) {
			return new NECDisplay(necAPI);
		}
		return new EmulatedDisplay(systemSettings, systemAPI);
	} catch (error) {
		return new EmulatedDisplay(systemSettings, systemAPI); // if NEC API fails or isn't defined in older FW
	}
}
