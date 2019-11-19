import IDisplay from './IDisplay';
import ISystemSettings from '../../SystemSettings/ISystemSettings';
import NECDisplay from './NECDisplay';
import EmulatedDisplay from './EmulatedDisplay';
import { INECAPI } from '../../API/NECAPI';
import { ISystemAPI } from '../../API/SystemAPI';
import { isNECDisplay } from '../../helper';

let display: IDisplay | null = null;

export async function getDisplay(necAPI: INECAPI, systemSettings: ISystemSettings, systemAPI: ISystemAPI): Promise<IDisplay> {
	if (display) {
		return display;
	}
	display = await createDisplay(necAPI, systemSettings, systemAPI);
	return display;
}

async function createDisplay(necAPI: INECAPI, systemSettings: ISystemSettings, systemAPI: ISystemAPI): Promise<IDisplay> {
	try {
		if (await isNECDisplay(necAPI)) {
			return new NECDisplay(necAPI);
		}
		return new EmulatedDisplay(systemSettings, systemAPI);
	} catch (error) {
		return new EmulatedDisplay(systemSettings, systemAPI); // if NEC API fails or isn't defined in older FW
	}
}
