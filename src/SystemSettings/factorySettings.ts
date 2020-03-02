import * as path from 'path';
import * as fs from 'fs-extra';
import IDisplay from '../Driver/Display/IDisplay';

export async function performDisplayFactorySettingsIfWasntPerformedYet(display: IDisplay, fileSystemBasePath: string) {
	if (!(await wasDisplayFactorySettingsPerformed(fileSystemBasePath))) {
		await display.resetSettings();
		await markDisplayFactorySettingsPerformed(fileSystemBasePath);
	}
}

async function wasDisplayFactorySettingsPerformed(fileSystemBasePath: string) {
	const filePath = getFlagFilePath(fileSystemBasePath);
	return await fs.pathExists(filePath);
}

async function markDisplayFactorySettingsPerformed(fileSystemBasePath: string) {
	const filePath = getFlagFilePath(fileSystemBasePath);
	await fs.writeFile(filePath, '1');
}

function getFlagFilePath(fileSystemBasePath: string) {
	return path.join(fileSystemBasePath, '.display_factory_settings_performed');
}
