import IDisplay from './IDisplay';
import ISystemSettings from '../../SystemSettings/ISystemSettings';
import NECDisplay from './NECDisplay';
import EmulatedDisplay from './EmulatedDisplay';
import { createNECAPI } from '../../API/NECAPI';

export async function createDisplay(systemSettings: ISystemSettings): Promise<IDisplay> {
	const necAPI = createNECAPI();
	const isNECDisplay = await necAPI.isNEC();
	if (isNECDisplay) {
		return new NECDisplay(necAPI);
	}
	return new EmulatedDisplay(systemSettings);
}
