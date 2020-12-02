import Opcode from './Opcode';

export class UnsupportedParameterError extends Error {
	constructor(opcode: Opcode) {
		super('Unsupported parameter ' + opcode);
		// https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
		Object.setPrototypeOf(this, UnsupportedParameterError.prototype);
	}
}

export class SetParameterError extends Error {
	constructor(opcode: Opcode, value: number) {
		super(`Failed to set parameter ${opcode}, value: ${value}`);
		// https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
		Object.setPrototypeOf(this, SetParameterError.prototype);
	}
}
