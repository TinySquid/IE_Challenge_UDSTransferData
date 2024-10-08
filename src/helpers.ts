export function bytesToInt(bytes: Uint8Array): number {
	let num = 0;

	for (const byte of bytes) {
		num = (num << 8) | byte;
	}

	return num;
}

export function bytesToPaddedHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join(" ");
}
