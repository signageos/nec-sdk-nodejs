import KeyCode from '@signageos/front-display/es6/NativeDevice/Input/KeyCode';
import Key from '../../CEC/Key';

const cecKeyMap: { [key: number]: KeyCode } = {
	[Key.SELECT]: KeyCode.OK,
	[Key.UP]: KeyCode.ARROW_UP,
	[Key.DOWN]: KeyCode.ARROW_DOWN,
	[Key.LEFT]: KeyCode.ARROW_LEFT,
	[Key.RIGHT]: KeyCode.ARROW_RIGHT,
	[Key.EXIT]: KeyCode.EXIT,
	[Key.BACKWARD]: KeyCode.BACKWARD,
	[Key.FORWARD]: KeyCode.FORWARD,
	[Key.PLAY]: KeyCode.PLAY,
	[Key.STOP]: KeyCode.STOP,
	[Key.PAUSE]: KeyCode.PAUSE,
};

export default cecKeyMap;
