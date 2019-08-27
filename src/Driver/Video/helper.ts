import { checksumString } from '@signageos/front-display/es6/Hash/checksum';

export function getVideoIdentificator(uri: string, x: number, y: number, width: number, height: number) {
	return checksumString(uri) + '_' + x + 'x' + y + '-' + width + 'x' + height;
}
