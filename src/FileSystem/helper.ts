import * as path from 'path';

export function trimSlashesAndDots(filePath: string): string {
	if (filePath === '.') {
		return '';
	}
	const trimedFilePath = filePath
		.replace(/\/\.\//g, '/')
		.replace(/\/+/g, '/')
		.replace(/\/+$/g, '')
		.replace(/^\/+/g, '')
		.replace(/\/\.\//g, '/');
	const normalizedTrimedFilePath = path.normalize(trimedFilePath);
	if (normalizedTrimedFilePath === filePath) {
		return filePath;
	}
	return trimSlashesAndDots(normalizedTrimedFilePath);
}
