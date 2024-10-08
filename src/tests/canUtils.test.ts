import { describe, it, expect, beforeAll } from "vitest";
import { filterCANLog, parseWriteService } from "../canUtils";

import path from "path";
import { promises as fs } from "fs";
import * as crypto from "crypto";

let canData: Uint8Array;
let transferData: Uint8Array;
let transferDataChecksum: string;

beforeAll(async () => {
	const canDataFile = path.resolve(__dirname, "data/mg1cs002-stockmapsflash.candata");
	canData = new Uint8Array(await fs.readFile(canDataFile));

	const transferDataFile = path.resolve(__dirname, "data/mg1cs002-stockmapsflash.transferdata.bin");
	transferData = new Uint8Array(await fs.readFile(transferDataFile));

	const hash = crypto.createHash("sha1");
	hash.update(transferData);
	transferDataChecksum = hash.digest("hex");
});

describe("parseWriteService", () => {
	it("should dump the transfer data from service 36", () => {
		const filteredBytes = filterCANLog(canData);
		const writeData = parseWriteService(filteredBytes);

		const hash = crypto.createHash("sha1");
		hash.update(writeData);
		const writeDataChecksum = hash.digest("hex");

		expect(writeData.length).toEqual(transferData.length);
		expect(writeDataChecksum).toEqual(transferDataChecksum);

		console.log(`SHA-1 original transferdata checksum             : ${transferDataChecksum}`);
		console.log(`SHA-1 parsed service 36 transferdata checksum    : ${writeDataChecksum}`);
	});
});
