import NECPD from '@signageos/nec-sdk/dist/NECPD';
import IDisplay from './IDisplay';
import ISystemSettings from '../../SystemSettings/ISystemSettings';
import NECDisplay from './NECDisplay';
import EmulatedDisplay from './EmulatedDisplay';
import { ISystemAPI } from '../../API/SystemAPI';
import { isNECDisplay } from '../../serverHelper';

let display: IDisplay | null = null;

export async function getDisplay(necPD: NECPD, systemSettings: ISystemSettings, systemAPI: ISystemAPI): Promise<IDisplay> {
	if (display) {
		return display;
	}
	return await createDisplay(necPD, systemSettings, systemAPI);
}

async function createDisplay(necPD: NECPD, systemSettings: ISystemSettings, systemAPI: ISystemAPI): Promise<IDisplay> {
	try {
		if (await isNECDisplay(necPD)) {
			return new NECDisplay(necPD);
		}
		return new EmulatedDisplay(systemSettings, systemAPI);
	} catch (error) {
		return new EmulatedDisplay(systemSettings, systemAPI); // if NEC API fails or isn't defined in older FW
	}
}
