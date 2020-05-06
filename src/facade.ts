/* tslint:disable:typedef */
/*
 * TODO add types
 * this file is a direct port of the original core functions from the Python SDK and since these functions are quite tricky to do right
 * I omitted the types and just made it work as is.
 * Hopefully in the future the types can be added and the tslint:disable directive can be removed.
 */
import {
	UnexpectedReplyError,
	readInt8ListFromBuffer,
	asciiEncodeValue2Bytes,
	asciiEncodeValue4Bytes,
	asciiDecodeValue,
	writeCommand,
} from './protocol';
import { ScheduleEvent, VideoInput, ScheduleType } from './constants';

function parseCommandReply (reply) {
	return {
		type: reply.readInt8(0),
		destinationAddress: reply.readInt8(1),
		payload: reply.slice(2),
	};
}

export interface IGetOrSetParameterResponse {
	result: number;
	opcode: number;
	type: number;
	maxValue: number;
	currentValue: number;
}

export function convertMonitorIdToAddress (monitorId) {
	const value = parseInt(monitorId);
	if (value >= 1 && value <= 100) {
		return 0x41 + value - 1;
	}
	if (monitorId.toLowerCase() === 'all') {
		return 0x2a;
	}
	if (monitorId.length === 1 && monitorId.toLowerCase() >= 'a' && monitorId.toLowerCase() <= 'j') {
		return monitorId.charCodeAt(0) - 0x61 + 0x31;
	}
	throw new Error('Invalid monitor id');
}

export function getOrSetParameter (port, address, getReply, opcode, value) {
	if (opcode < 0x0000 || opcode > 0xffff) {
		throw new Error('invalid opcode 0x' + opcode.toString(16));
	}
	if (typeof value !== 'undefined' && (value < 0x0000 || value > 0xffff)) {
		throw new Error('invalid value 0x' + value.toString(16));
	}
	let sendData = asciiEncodeValue4Bytes(opcode);
	let messageType;
	let expectedReplyType;
	if (typeof value === 'undefined') {
		messageType = 0x43;
		expectedReplyType = 0x44;
	} else {
		messageType = 0x45;
		expectedReplyType = 0x46;
		sendData = sendData.concat(asciiEncodeValue4Bytes(value));
	}
	writeCommand(port, sendData, address, messageType);
	return getReply(true).then(function (replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		if (reply.payload.length !== 16) {
			throw new UnexpectedReplyError(`unexpected reply length: ${reply.payload.length} but expected 16`);
		}
		if (reply.type !== expectedReplyType) {
			throw new Error(`unexpected reply type: 0x${reply.type.toString(16)} but expected 0x${expectedReplyType.toString(16)}`);
		}
		let index = 0;
		// result
		const RESULT_LEN = 2;
		const result = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, RESULT_LEN, index));
		index += RESULT_LEN;
		// opcode
		const OPCODE_LEN = 4;
		const replyOpcode = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, OPCODE_LEN, index));
		index += OPCODE_LEN;
		// type
		const TYPE_LEN = 2;
		const replyType = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, TYPE_LEN, index));
		index += TYPE_LEN;
		// max value
		const MAX_VALUE_LEN = 4;
		const maxValue = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, MAX_VALUE_LEN, index));
		index += MAX_VALUE_LEN;
		// current value
		const CURRENT_VALUE_LEN = 4;
		const currentValue = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, CURRENT_VALUE_LEN, index));
		return {
			result,
			opcode: replyOpcode,
			type: replyType,
			maxValue,
			currentValue,
		};
	});
}

export function getPowerStatus (port, address, getReply) {
	let sendData = asciiEncodeValue4Bytes(0x01d6);
	writeCommand(port, sendData, address, 0x41);
	return getReply(true).then(function (replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		if (reply.payload.length !== 16) {
			throw new UnexpectedReplyError(`unexpected reply length: ${reply.payload.length} but expected 16`);
		}
		if (reply.type !== 0x42) {
			throw new UnexpectedReplyError(`unexpected reply type: 0x${reply.type.toString(16)} but expected 0x42`);
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 0)) !== 0x0200) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 4)) !== 0xD600) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		return asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 12));
	});
}

export function setPowerStatus (port, address, getReply, powerStatus) {
	if (powerStatus < 1 || powerStatus > 4) {
		throw new Error('invalid power status ' + powerStatus);
	}
	let sendData = asciiEncodeValue2Bytes(0xc2);
	sendData = sendData.concat(asciiEncodeValue4Bytes(0x03d6));
	sendData = sendData.concat(asciiEncodeValue4Bytes(powerStatus));
	writeCommand(port, sendData, address, 0x41);
	return getReply(true).then(function (replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		if (reply.payload.length !== 12) {
			throw new UnexpectedReplyError(`unexpected reply length: ${reply.payload.length} but expected 12`);
		}
		if (reply.type !== 0x42) {
			throw new UnexpectedReplyError(`unexpected reply type: 0x${reply.type.toString(16)} but expected 0x42`);
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 0)) !== 0x00c2) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 4)) !== 0x03d6) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		return asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 8));
	});
}

export interface ISchedule {
	index: number;
	event: ScheduleEvent;
	hour: number;
	minute: number;
	input: VideoInput;
	week: number;
	type: ScheduleType;
	pictureMode: number;
	year: number;
	month: number;
	day: number;
	order: number;
	extension1: number;
	extension2: number;
	extension3: number;
}

function parseScheduleReply (command, reply) {
	let status = 0;
	let offset = 4;
	if (command === 0xc23d) {
		// read command
		if (reply.payload.length !== 34) {
			throw new UnexpectedReplyError(`unexpected reply length: ${reply.payload.length} but expected 34`);
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 0)) !== 0xc33d) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
	} else if (command === 0xc23e) {
		// write command
		if (reply.payload.length !== 36) {
			throw new UnexpectedReplyError(`unexpected reply length: ${reply.payload.length} but expected 36`);
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 0)) !== 0xc33e) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		const REPLY_STATUS_LEN = 2;
		status = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, REPLY_STATUS_LEN, offset));
		offset += REPLY_STATUS_LEN;
	}
	// check reply type
	if (reply.type !== 0x42) {
		throw new UnexpectedReplyError(`unexpected reply type: 0x${reply.type.toString(16)} but expected 0x42`);
	}

	// parameter length i 2 for all params
	const PARAM_LEN = 2;

	// schedule number
	const scheduleNumber = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;

	// event
	const event = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;
	if (event < 1 || event > 2) {
		throw new UnexpectedReplyError(`unepected event: ${event} but expected 1 or 2`);
	}

	// hour and minute
	const hour = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;
	const minute = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;

	// input
	const input = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;

	// week
	const week = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;

	// type
	const type = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;

	// picture mode
	const pictureMode = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;

	// year
	let year = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;
	if (year > 0) {
		year += 2000;
	}

	// month
	let month = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;

	// day
	let day = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;

	// order
	let order = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;

	// extension 1
	let extension1 = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;

	// extension 2
	let extension2 = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));
	offset += PARAM_LEN;

	// extension 3
	let extension3 = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, PARAM_LEN, offset));

	return {
		status, index: scheduleNumber, event, hour, minute, input, week, type, pictureMode,
		year, month, day, order, extension1, extension2, extension3,
	};
}

export function getSchedule (port, address, getReply, index) {
	if (index < 0 || index > 30) {
		throw new Error('invalid schedule number ' + index);
	}
	let sendData = asciiEncodeValue4Bytes(0xc23d);
	sendData = sendData.concat(asciiEncodeValue2Bytes(index));
	writeCommand(port, sendData, address, 0x41);
	return getReply(true).then(function (replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		return parseScheduleReply(0xc23d, reply);
	});
}

export function setSchedule(port, address, getReply, schedule) {
	// validate
	if (schedule.index < 0 || schedule.index > 30) {
		throw new Error('invalid schedule number ' + schedule.index);
	}
	if (schedule.event <= 0 || schedule.event > 2) {
		throw new Error('invalid schedule event ' + schedule.event);
	}
	if (schedule.hour < 0 || schedule.hour > 24) {
		throw new Error('invalid schedule hour ' + schedule.hour);
	}
	if (schedule.minute < 0 || schedule.minute > 60) {
		throw new Error('invalid schedule minute ' + schedule.minute);
	}
	if (schedule.input < 0 || schedule.input > 255) {
		throw new Error('invalid schedule input ' + schedule.input);
	}
	if (schedule.week < 0 || schedule.week > 0x7f) {
		throw new Error('invalid schedule week ' + schedule.week);
	}
	if (schedule.pictureMode < 0 || schedule.pictureMode > 255) {
		throw new Error('invalid schedule pictureMode ' + schedule.pictureMode);
	}
	if (schedule.extension1 < 0 || schedule.extension1 > 255) {
		throw new Error('invalid schedule extension 1 ' + schedule.extension1);
	}
	if (schedule.extension2 < 0 || schedule.extension2 > 255) {
		throw new Error('invalid schedule extension 2 ' + schedule.extension2);
	}
	if (schedule.extension3 < 0 || schedule.extension3 > 255) {
		throw new Error('invalid schedule extension 3 ' + schedule.extension3);
	}
	// send data
	let sendData: number[] = [];
	sendData = sendData.concat(asciiEncodeValue4Bytes(0xc23e));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.index));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.event));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.hour));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.minute));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.input));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.week));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.type));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.pictureMode));
	let year = schedule.year;
	if (schedule.year > 2000) {
		year -= 2000;
	}
	sendData = sendData.concat(asciiEncodeValue2Bytes(year));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.month));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.day));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.order));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.extension1));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.extension2));
	sendData = sendData.concat(asciiEncodeValue2Bytes(schedule.extension3));
	writeCommand(port, sendData, address, 0x41);
	return getReply(true).then(function (replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		return parseScheduleReply(0xc23e, reply);
	});
}

export function enableDisableSchedule (port, address, getReply, index, enableDisable) {
	let sendData: number[] = [];
	sendData = sendData.concat(asciiEncodeValue4Bytes(0xc23f));
	sendData = sendData.concat(asciiEncodeValue2Bytes(index));
	sendData = sendData.concat(asciiEncodeValue2Bytes(enableDisable));
	writeCommand(port, sendData, address, 0x41);
	return getReply(true).then(function (replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		if (reply.payload.length !== 10) {
			throw new UnexpectedReplyError(`reply length ${reply.payload.length} but expected 10`);
		}
		if (reply.type !== 0x42) {
			throw new UnexpectedReplyError(`unexpected reply type: 0x${reply.type.toString(16)} but expected 0x42`);
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 0)) !== 0xc33f) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		const replyStatus = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 4));
		const replyIndex = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 6));
		const replyEnableDisable = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 8));
		return {
			status: replyStatus,
			index: replyIndex,
			enableDisable: replyEnableDisable,
		};
	});
}

export function setComputeModuleSettingsLock(port, address, getReply, secureMode, password) {
	if (secureMode < 0 || secureMode > 3) {
		throw new Error('invalid secure mode ' + secureMode);
	}
	if (password.length !== 4) {
		throw new Error('password length must be 4');
	}
	let sendData: number[] = [];
	sendData = sendData.concat(asciiEncodeValue4Bytes(0xca1b));
	sendData = sendData.concat(asciiEncodeValue2Bytes(secureMode));
	for (let char of password) {
		const asciiValue = char.charCodeAt(0);
		if (asciiValue < 0x30 || asciiValue > 0x39) {
			throw new Error('password contains invalid symbols, only 0-9 allowed');
		}
		sendData = sendData.concat(asciiEncodeValue2Bytes(asciiValue - 0x30));
	}
	writeCommand(port, sendData, address, 0x41);
	return getReply(true).then(function (replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		if (reply.payload.length !== 8) {
			throw new Error(`unexpected reply length: ${reply.payload.length} but expected 8`);
		}
		if (reply.type !== 0x42) {
			throw new Error(`unexpected reply type: 0x${reply.type.toString(16)} but expected 0x42`);
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 0)) !== 0xcb1b) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		const status = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 4));
		const mode = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 6));
		return { status, mode };
	});
}

export function getDateAndTime(port, address, getReply) {
	const sendData = asciiEncodeValue4Bytes(0xc211);
	writeCommand(port, sendData, address, 0x41);
	return getReply(true).then(function(replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		if (reply.payload.length !== 18) {
			throw new Error(`unexpected reply length: ${reply.payload.length} but expected 18`);
		}
		if (reply.type !== 0x42) {
			throw new Error(`unexpected reply type: 0x${reply.type.toString(16)} but expected 0x42`);
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 0)) !== 0xc311) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		const year = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 4));
		const month = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 6));
		const day = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 8));
		const hour = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 12));
		const minute = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 14));
		return new Date(year + 2000, month - 1, day, hour, minute);
	});
}

export function setDateAndTime(port, address, getReply, date) {
	const year = date.getFullYear() - 2000;
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const weekday = 0;
	const hour = date.getHours();
	const minute = date.getMinutes();
	const daylightSavings = 0;

	let sendData: number[] = [];
	sendData = sendData.concat(asciiEncodeValue4Bytes(0xc212));
	sendData = sendData.concat(asciiEncodeValue2Bytes(year));
	sendData = sendData.concat(asciiEncodeValue2Bytes(month));
	sendData = sendData.concat(asciiEncodeValue2Bytes(day));
	sendData = sendData.concat(asciiEncodeValue2Bytes(weekday));
	sendData = sendData.concat(asciiEncodeValue2Bytes(hour));
	sendData = sendData.concat(asciiEncodeValue2Bytes(minute));
	sendData = sendData.concat(asciiEncodeValue2Bytes(daylightSavings));
	writeCommand(port, sendData, address, 0x41);
	getReply(true).then(function(replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		if (reply.payload.length !== 20) {
			throw new Error(`unexpected reply length: ${reply.payload.length} but expected 20`);
		}
		if (reply.type !== 0x42) {
			throw new Error(`unexpected reply type: 0x${reply.type.toString(16)} but expected 0x42`);
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 0)) !== 0xc312) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		const status = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 4));
		if (status !== 0) {
			throw new Error('reply status is not 0');
		}
		const replyYear = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 6));
		const replyMonth = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 8));
		const replyDay = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 10));
		const replyHour = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 14));
		const replyMinute = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 16));
		return new Date(replyYear + 2000, replyMonth - 1, replyDay, replyHour, replyMinute);
	});
}

export function getModelName(port, address, getReply) {
	const sendData = asciiEncodeValue4Bytes(0xc217);
	writeCommand(port, sendData, address, 0x41);
	return getReply(true).then(function (replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		if (reply.payload.length < 4) {
			throw new Error(`unexpected reply length: ${reply.payload.length} but expected >= 4`);
		}
		if (reply.type !== 0x42) {
			throw new Error(`unexpected reply type: 0x${reply.type.toString(16)} but expected 0x42`);
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 0)) !== 0xc317) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		let offset = 4;
		let modelName = '';
		while (offset < reply.payload.length) {
			const asciiValue = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, offset));
			if (asciiValue === 0) {
				break;
			}
			modelName += String.fromCharCode(asciiValue);
			offset += 2;
		}
		return modelName;
	});
}

export function getSerialNumber(port, address, getReply) {
	const sendData = asciiEncodeValue4Bytes(0xc216);
	writeCommand(port, sendData, address, 0x41);
	return getReply(true).then(function (replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		if (reply.payload.length < 4) {
			throw new Error(`unexpected reply length: ${reply.payload.length} but expected >= 4`);
		}
		if (reply.type !== 0x42) {
			throw new Error(`unexpected reply type: 0x${reply.type.toString(16)} but expected 0x42`);
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 0)) !== 0xc316) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		let offset = 4;
		let serialNumber = '';
		while (offset < reply.payload.length) {
			const asciiValue = asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, offset));
			if (asciiValue === 0) {
				break;
			}
			serialNumber += String.fromCharCode(asciiValue);
			offset += 2;
		}
		return serialNumber;
	});
}

export function getFirmwareVersion(port, address, getReply, firmwareType) {
	if (firmwareType < 0 || firmwareType > 4) {
		throw new Error('invalid firmware type ' + firmwareType);
	}
	let sendData: number[] = [];
	sendData = sendData.concat(asciiEncodeValue4Bytes(0xca02));
	sendData = sendData.concat(asciiEncodeValue2Bytes(firmwareType));
	writeCommand(port, sendData, address, 0x41);
	return getReply(true).then(function (replyBuffer) {
		const reply = parseCommandReply(replyBuffer);
		if (reply.payload.length < 8) {
			throw new Error(`unexpected reply length: ${reply.payload.length} but expected >= 8`);
		}
		if (reply.type !== 0x42) {
			throw new Error(`unexpected reply type: 0x${reply.type.toString(16)} but expected 0x42`);
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 4, 0)) !== 0xcb02) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		if (asciiDecodeValue(readInt8ListFromBuffer(reply.payload, 2, 6)) !== firmwareType) {
			throw new UnexpectedReplyError('unexpected reply received');
		}
		let firmwareVersion = '';
		for (let i = 8; i < reply.payload.length; i++) {
			const asciiValue = reply.payload.readInt8(i);
			if (asciiValue === 0) {
				break;
			}
			firmwareVersion += String.fromCharCode(asciiValue);
		}
		return firmwareVersion;
	});
}
