import PublicOrientation from '@signageos/front-display/es6/NativeDevice/Orientation';

enum Orientation {
	LANDSCAPE = 'landscape',
	LANDSCAPE_FLIPPED = 'landscape_flipped',
	PORTRAIT = 'portrait',
	PORTRAIT_FLIPPED = 'portrait_flipped'
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
