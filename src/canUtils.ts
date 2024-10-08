import { bytesToInt } from "./helpers";

const ECU_CAN_ID = 0x7e8;
const DONGLE_CAN_ID = 0x7e0;
const DEFAULT_CAN_MESSAGE_LENGTH = 17;

const WRITE_SERVICE_REQ_ID = 0x36;
const WRITE_SERVICE_RES_ID = 0x76;

const CAN_ID_BYTE_OFFSET = 4;
const CAN_ID_BYTE_LENGTH = 4;

const CAN_DEFAULT_SERVICE_BYTE_OFFSET = 10;
const CAN_MULTI_FRAME_SERVICE_BYTE_OFFSET = 11;
const CAN_MULTI_FRAME_SIZE_OFFSET = 9;
const CAN_MULTI_FRAME_INITIAL_DATA_OFFSET = 13;
const CAN_MULTI_FRAME_DATA_OFFSET = 10;

/***
 * Removes all messages from the CAN log that are not from the ECU or the dongle.
 */
export function filterCANLog(bytes: Uint8Array) {
	const filteredMessages: number[] = [];

	for (let i = 0; i < bytes.length; i += DEFAULT_CAN_MESSAGE_LENGTH) {
		const message = extractMessage(bytes, i);
		const canID = extractIdFromMessage(message);

		if (canID === ECU_CAN_ID || canID === DONGLE_CAN_ID) {
			filteredMessages.push(...message);
		}
	}

	return new Uint8Array(filteredMessages);
}

export function parseWriteService(bytes: Uint8Array): Uint8Array {
	const frames = extractWriteFrames(bytes);
	const writeData: number[] = [];

	// rebuild data by stitching together the write frames
	// first message of every frame only has 4 bytes of data
	// every message afterwards has 7 bytes of data.
	// the last message of a frame may have less than 7 bytes of data, account for size declaration in first message

	// 00 00 CD CB 00 00 07 E0 08 1F FD 36 01 BD 4D A8 AC
	// 1 -> first message in multi frame packet, F FD -> size of frame,
	// 36 -> service, 01 -> packet number, BD 4D A8 AC -> data

	frames.forEach((frame) => {
		let frameSize = 0;
		let bytesSliced = 0;

		for (let i = 0; i < frame.length - 1; i += DEFAULT_CAN_MESSAGE_LENGTH) {
			// first message of a multi frame packet has a different offset for data
			if (i === 0) {
				frameSize = bytesToInt(frame.slice(CAN_MULTI_FRAME_SIZE_OFFSET, CAN_MULTI_FRAME_SIZE_OFFSET + 2)) & 0xfff;
				writeData.push(
					...frame.slice(i + CAN_MULTI_FRAME_INITIAL_DATA_OFFSET, i + CAN_MULTI_FRAME_INITIAL_DATA_OFFSET + 4),
				);
				bytesSliced += 6;
			} else {
				const bytesRemaining = frameSize - bytesSliced;
				// extract just the data from the message
				if (bytesRemaining >= 7) {
					writeData.push(...frame.slice(i + CAN_MULTI_FRAME_DATA_OFFSET, i + CAN_MULTI_FRAME_DATA_OFFSET + 7));
					bytesSliced += 7;
				} else {
					writeData.push(
						...frame.slice(i + CAN_MULTI_FRAME_DATA_OFFSET, i + CAN_MULTI_FRAME_DATA_OFFSET + bytesRemaining),
					);
					bytesSliced += bytesRemaining;
				}
			}
		}
	});

	return new Uint8Array(writeData);
}

/***
 * Extracts multi-packet service 36 frames
 */
function extractWriteFrames(bytes: Uint8Array): Uint8Array[] {
	const frameQueue: Uint8Array[] = [];
	let currentFrame: number[] = [];

	for (let i = 0; i < bytes.length; i += DEFAULT_CAN_MESSAGE_LENGTH) {
		const message = extractMessage(bytes, i);
		const canID = extractIdFromMessage(message);

		const frameServiceReqId = bytesToInt(
			message.slice(CAN_MULTI_FRAME_SERVICE_BYTE_OFFSET, CAN_MULTI_FRAME_SERVICE_BYTE_OFFSET + 1),
		);

		const frameServiceResId = bytesToInt(
			message.slice(CAN_DEFAULT_SERVICE_BYTE_OFFSET, CAN_DEFAULT_SERVICE_BYTE_OFFSET + 1),
		);

		// We don't want to include the flow control messages in the frame
		const isFrameFlowControlByte =
			bytesToInt(message.slice(CAN_MULTI_FRAME_SIZE_OFFSET, CAN_MULTI_FRAME_SIZE_OFFSET + 1)) === 0x30;

		if (canID === DONGLE_CAN_ID && frameServiceReqId === WRITE_SERVICE_REQ_ID && currentFrame.length === 0) {
			currentFrame.push(...message);
		} else if (currentFrame.length > 0) {
			if (canID === ECU_CAN_ID && frameServiceResId === WRITE_SERVICE_RES_ID) {
				frameQueue.push(new Uint8Array(currentFrame));
				currentFrame = [];
			} else if (canID === DONGLE_CAN_ID && !isFrameFlowControlByte) {
				currentFrame.push(...message);
			}
		}
	}

	return frameQueue;
}

// Helpers
function extractMessage(bytes: Uint8Array, start: number): Uint8Array {
	return bytes.slice(start, start + DEFAULT_CAN_MESSAGE_LENGTH);
}

function extractIdFromMessage(bytes: Uint8Array): number {
	return bytesToInt(bytes.slice(CAN_ID_BYTE_OFFSET, CAN_ID_BYTE_OFFSET + CAN_ID_BYTE_LENGTH));
}
