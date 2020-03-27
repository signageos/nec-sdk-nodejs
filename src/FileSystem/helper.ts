import * as path from 'path';
import * as fs from 'fs';
import * as express from 'express';

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

export function pipeFileToResponse(absolutePath: string, res: express.Response) {
	try {
		const fileReadStream = fs.createReadStream(absolutePath);
		res.status(200);
		fileReadStream.pipe(res);
	} catch (error) {
		res.status(500).send();
		throw error;
	}
}
