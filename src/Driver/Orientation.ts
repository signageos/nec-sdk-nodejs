import PublicOrientation from '@signageos/front-display/es6/NativeDevice/Orientation';

enum Orientation {
	LANDSCAPE = 'LANDSCAPE',
	LANDSCAPE_FLIPPED = 'LANDSCAPE_FLIPPED',
	PORTRAIT = 'PORTRAIT',
	PORTRAIT_FLIPPED = 'PORTRAIT_FLIPPED'
}

export default Orientation;

export function convertScreenOrientationToAngle(orientation: PublicOrientation) {
	switch (orientation) {
		case PublicOrientation.LANDSCAPE:
			return 0;
		case PublicOrientation.LANDSCAPE_FLIPPED:
			return 180;
		case PublicOrientation.PORTRAIT:
			return 90;
		case PublicOrientation.PORTRAIT_FLIPPED:
			return 270;
		default:
			throw new Error('Invalid orientation');
	}
}
