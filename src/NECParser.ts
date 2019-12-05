// tslint:disable:no-bitwise bitwise operations in this file are not a mistake
import { Transform, TransformCallback } from 'stream';
import { UnexpectedReplyError, NullMessageReplyError, asciiEncodeValue2Bytes } from './protocol';

enum Stage {
	start,
	reserved,
	dest_address,
	reply_dest_address,
	message_type,
	message_length_1,
	message_length_2,
	payload_stx,
	payload,
	payload_etx,
	checksum,
	delimiter,
}

export default class NECParser extends Transform {

	private destinationReplyIsMonitorId: boolean;
	private stage: Stage;
	private checksum: number;
	private destAddress: number;
	private messageType: number;
	private messageLengthBytes: number[];
	private messageLength: number;
	private payload: number[];

	constructor() {
		super();
		this.reset();
	}

	public setDestinationReplyIsMonitorId(value: boolean) {
		this.destinationReplyIsMonitorId = value;
	}

	public _transform(chunk: any, _encoding: string, cb: TransformCallback) {
		for (let i = 0; i < chunk.length; i++) {
			switch (this.stage) {
				case Stage.start:
					const soh = chunk.readInt8(i);
					if (soh !== 0x01) {
						cb(new UnexpectedReplyError(`incorrect SOH: received 0x${soh.toString(16)} but expected 0x01`));
						return;
					}
					this.stage = Stage.reserved;
					break;
				case Stage.reserved:
					const reserved = chunk.readInt8(i);
					if (reserved !== 0x30) {
						cb(new UnexpectedReplyError(`incorrect reserved: received 0x${reserved.toString(16)} but expected 0x30`));
						return;
					}
					this.checksum ^= reserved;
					this.stage = Stage.dest_address;
					break;
				case Stage.dest_address:
					const destAddr = chunk.readInt8(i);
					if (!this.destinationReplyIsMonitorId && destAddr !== 0x30) {
						cb(new UnexpectedReplyError(
							`incorrect destination address: received 0x${destAddr.toString(16)} but expected 0x30`),
						);
						return;
					}
					this.checksum ^= destAddr;
					this.stage = Stage.reply_dest_address;
					break;
				case Stage.reply_dest_address:
					this.destAddress = chunk.readInt8(i);
					this.checksum ^= this.destAddress;
					this.stage = Stage.message_type;
					break;
				case Stage.message_type:
					this.messageType = chunk.readInt8(i);
					this.checksum ^= this.messageType;
					this.stage = Stage.message_length_1;
					break;
				case Stage.message_length_1:
					this.messageLengthBytes[0] = chunk.readInt8(i);
					this.checksum ^= this.messageLengthBytes[0];
					this.stage = Stage.message_length_2;
					break;
				case Stage.message_length_2:
					this.messageLengthBytes[1] = chunk.readInt8(i);
					this.checksum ^= this.messageLengthBytes[1];
					const messageLength = parseInt(Buffer.from(this.messageLengthBytes).toString('utf8'), 16);
					this.messageLength = messageLength - 2; // counts stx and etx too
					if (this.messageLength > 0) {
						this.stage = Stage.payload_stx;
					} else {
						this.stage = Stage.payload_etx;
					}
					break;
				case Stage.payload_stx:
					const stx = chunk.readInt8(i);
					if (stx !== 0x02) {
						cb(new UnexpectedReplyError(`incorrect STX: received 0x${stx.toString(16)} but expected 0x02`));
						return;
					}
					this.checksum ^= stx;
					this.stage = Stage.payload;
					break;
				case Stage.payload:
					const payloadByte = chunk.readInt8(i);
					this.checksum ^= payloadByte;
					this.payload.push(payloadByte);
					this.messageLength--;
					if (this.messageLength === 0) {
						this.stage = Stage.payload_etx;
					}
					break;
				case Stage.payload_etx:
					const etx = chunk.readInt8(i);
					if (etx !== 0x03) {
						cb(new UnexpectedReplyError(`incorrect ETX: received 0x${etx.toString(16)} but expected 0x03`));
						return;
					}
					this.checksum ^= etx;
					this.stage = Stage.checksum;
					break;
				case Stage.checksum:
					const expectedChecksum = chunk.readInt8(i);
					if (this.checksum !== expectedChecksum) {
						cb(new UnexpectedReplyError(
							`incorrect checksum: received 0x${expectedChecksum.toString(16)} ` +
							`but expected 0x${this.checksum.toString(16)}`,
						));
						return;
					}
					this.stage = Stage.delimiter;
					break;
				case Stage.delimiter:
					const delimiter = chunk.readInt8(i);
					if (delimiter !== 0x0d) {
						cb(new UnexpectedReplyError(`incorrect delimiter: received 0x${delimiter.toString(16)} but expected 0x0d`));
						return;
					}
					if (this.payload.length === 2 && JSON.stringify(this.payload) === JSON.stringify(asciiEncodeValue2Bytes(0xbe))) {
						cb(new NullMessageReplyError('null message received'));
						return;
					}
					const result = [this.messageType, this.destAddress].concat(this.payload);
					this.reset();
					this.push(Buffer.from(result));
					break;
				default:
					cb(new Error('unexpected stage'));
					return;
			}
		}
		cb();
	}

	public _flush(cb: TransformCallback) {
		this.reset();
		cb();
	}

	public reset() {
		this.destinationReplyIsMonitorId = false;
		this.stage = Stage.start;
		this.checksum = 0;
		this.destAddress = 0;
		this.messageType = 0;
		this.messageLengthBytes = [];
		this.messageLength = 0;
		this.payload = [];
	}
}
