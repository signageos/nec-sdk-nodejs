import IDisplay from '../Driver/Display/IDisplay';
import ISystemSettings from './ISystemSettings';

export async function performFactorySettingsIfWasntPerformedYet(display: IDisplay, systemSettings: ISystemSettings) {
	if (!(await systemSettings.wasFactorySettingsPerformed())) {
		await display.resetSettings();
		await systemSettings.setFactorySettingsPerformed();
	}
}
