import IDisplay from './IDisplay';
import ISystemSettings from '../../SystemSettings/ISystemSettings';
import NECDisplay from './NECDisplay';
import EmulatedDisplay from './EmulatedDisplay';
import { NECAPI } from '../../API/NECAPI';

export async function createDisplay(systemSettings: ISystemSettings): Promise<IDisplay> {
	const necAPI = new NECAPI();
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
