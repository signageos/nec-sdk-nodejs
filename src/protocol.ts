export class UnexpectedReplyError extends Error {}
export class NullMessageReplyError extends Error {}
export class TimeoutError extends Error {}

export function readInt8ListFromBuffer (buffer, bytesCount, index) {
	const result: number[] = [];
	for (let i = 0; i < bytesCount; i++) {
		const byte = buffer.readInt8(index + i);
		result.push(byte);
	}
	return result;
}

export function asciiEncodeValue2Bytes (value) {
	const outputData: number[] = [];
	if (value < 0 || value > 0xff) {
		throw new Error('invalid value');
	}
	let val = value >> 4;
	if (val > 9) {
		val += 65 - 10;
	} else {
		val += 48;
	}
	outputData.push(val);
	val = (value & 0x0f) % 16;
	if (val > 9) {
		val += 65 - 10;
	} else {
		val += 48;
	}
	outputData.push(val);
	return outputData;
}

export function asciiEncodeValue4Bytes (value) {
	if (value < 0 || value > 0xffff) {
		throw new Error('invalid value');
	}
	const data = asciiEncodeValue2Bytes(value >> 8);
	const result = data.concat(asciiEncodeValue2Bytes(value & 0x00ff));
	return result;
}

export function asciiDecodeValue (data) {
	let value = 0;
	for (let byte of data) {
		value *= 16;
		if (byte >= 48 && byte <= 57) {
			value += byte - 48;
		} else if (byte >= 65 && byte <= 72) {
			value += byte - 65 + 10;
		} else if (byte >= 97 && byte <= 104) {
			value += byte - 97 + 10;
		} else {
			console.error('asciiDecodeValue: invalid hex character 0x' + byte.toString(16));
			value = 0;
		}
	}
	return value;
}

export function writeCommand (port, data, address, messageType) {
	let outputData: number[] = [];
	// SOH
	outputData.push(0x01);
	// fixed
	outputData.push(0x30);
	// destination adress
	outputData.push(address);
	// source address
	outputData.push(0x30);
	// message type
	outputData.push(messageType);
	// message length
	const length = data.length + 2;
	outputData = outputData.concat(asciiEncodeValue2Bytes(length));
	// STX
	outputData.push(0x02);
	// data
	outputData = outputData.concat(data);
	// ETX
	outputData.push(0x03);
	// checksum
	let checksum = 0;
	for (let i = 1; i < outputData.length; i++) {
		checksum ^= outputData[i];
	}
	outputData.push(checksum);
	// delimiter
	outputData.push(0x0D);
	port.write(Buffer.from(outputData));
}
