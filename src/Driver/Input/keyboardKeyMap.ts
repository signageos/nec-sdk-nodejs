import KeyCode from '@signageos/front-display/es6/NativeDevice/Input/KeyCode';

const keyboardKeyMap: { [key: string]: KeyCode } = {
	'0': KeyCode.NUM_0,
	'1': KeyCode.NUM_1,
	'2': KeyCode.NUM_2,
	'3': KeyCode.NUM_3,
	'4': KeyCode.NUM_4,
	'5': KeyCode.NUM_5,
	'6': KeyCode.NUM_6,
	'7': KeyCode.NUM_7,
	'8': KeyCode.NUM_8,
	'9': KeyCode.NUM_9,
	'ArrowLeft': KeyCode.ARROW_LEFT,
	'ArrowRight': KeyCode.ARROW_RIGHT,
	'ArrowUp': KeyCode.ARROW_UP,
	'ArrowDown': KeyCode.ARROW_DOWN,
	'Enter': KeyCode.OK,
	'Meta': KeyCode.HOME,
	'Escape': KeyCode.EXIT,
	'Backspace': KeyCode.BACKSPACE,
	'MediaPlayPause': KeyCode.PLAY_PAUSE,
	'MediaStop': KeyCode.STOP,
	'MediaTrackPrevious': KeyCode.BACKWARD,
	'MediaTrackNext': KeyCode.FORWARD,
	'AudioVolumeMute': KeyCode.VOLUME_MUTE,
	'AudioVolumeDown': KeyCode.VOLUME_DOWN,
	'AudioVolumeUp': KeyCode.VOLUME_UP,
};

export default keyboardKeyMap;
