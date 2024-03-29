enum Opcode {
	SCREEN_BRIGHTNESS = 0x0010,
	INPUT = 0x0060,
	AUDIO_VOLUME = 0x0062,
	AUDIO_MUTE = 0x008d,
	OSD_INFORMATION = 0x023d,
	OSD_ROTATION = 0x0241,
	OSD_SIGNAL_INFORMATION = 0x02ea,
	MONITOR_ID = 0x023e,
	INPUT_CHANGE = 0x1086,
	INPUT_CHANGE_SUPER_INPUT_1 = 0x10ce,
	INPUT_CHANGE_SUPER_INPUT_2 = 0x10cf,
	HUMAN_SENSOR_ATTACHMENT_STATUS = 0x10f0,
	HUMAN_SENSOR_STATUS = 0x114c,
	CEC = 0x1176,
	CEC_AUTO_TURN_OFF = 0x1177,
	CEC_SEARCH_DEVICE = 0x1179,
	COMPUTE_MODULE_FAN_POWER_MODE = 0x11b5,
	COMPUTE_MODULE_AUTO_POWER_ON = 0x117d,
	COMPUTE_MODULE_WATCHDOG_TIMER_ENABLE = 0x119b,
	COMPUTE_MODULE_SHUTDOWN_SIGNAL = 0x1181,
	USB_PC_SOURCE = 0x1174,
	HDMI_SIGNAL = 0x1040,
	G_SENSOR = 0x11b4,
}

export default Opcode;
