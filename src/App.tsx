import { useState, useEffect, useRef } from "react";
import FileUploadButton from "./components/FileUploadButton/FileUploadButton";
import FileDownloadRef from "./components/FileDownloadRef/FileDownloadRef";
import { filterCANLog, parseWriteService } from "./canUtils";

import classes from "./App.module.css";

function App() {
	const [file, setFile] = useState<File | null>(null);
	const downloadRef = useRef<HTMLAnchorElement>(null);

	const downloadTransferData = (bytes: Uint8Array) => {
		if (downloadRef.current) {
			const blob = new Blob([bytes], { type: "application/octet-stream" });
			const url = URL.createObjectURL(blob);

			downloadRef.current.href = url;
			downloadRef.current.click();
			URL.revokeObjectURL(url);
		}
	};

	useEffect(() => {
		if (file) {
			const reader = new FileReader();

			reader.onload = (event) => {
				const data = event.target?.result as ArrayBuffer;
				const bytes = new Uint8Array(data);

				const filteredBytes = filterCANLog(bytes);
				const writeData = parseWriteService(filteredBytes);

				downloadTransferData(writeData);
			};

			reader.readAsArrayBuffer(file);
		}
	}, [file]);

	return (
		<div className={classes.card}>
			<FileUploadButton setFile={setFile} />
			<FileDownloadRef downloadRef={downloadRef} fileName={"mg1cs002-stockmapsflash-dump.transferdata.bin"} />
		</div>
	);
}

export default App;
