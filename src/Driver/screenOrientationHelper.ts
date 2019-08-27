import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';

export function convertScreenOrientationToAngle(orientation: Orientation) {
	switch (orientation) {
		case Orientation.LANDSCAPE:
			return 0;
		case Orientation.LANDSCAPE_FLIPPED:
			return 180;
		case Orientation.PORTRAIT:
			return 90;
		case Orientation.PORTRAIT_FLIPPED:
			return 270;
		default:
			throw new Error('Invalid orientation');
	}
}
