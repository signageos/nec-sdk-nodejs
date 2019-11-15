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
	[Key.NUM_0]: KeyCode.NUM_0,
	[Key.NUM_1]: KeyCode.NUM_1,
	[Key.NUM_2]: KeyCode.NUM_2,
	[Key.NUM_3]: KeyCode.NUM_3,
	[Key.NUM_4]: KeyCode.NUM_4,
	[Key.NUM_5]: KeyCode.NUM_5,
	[Key.NUM_6]: KeyCode.NUM_6,
	[Key.NUM_7]: KeyCode.NUM_7,
	[Key.NUM_8]: KeyCode.NUM_8,
	[Key.NUM_9]: KeyCode.NUM_9,
};

export default cecKeyMap;
