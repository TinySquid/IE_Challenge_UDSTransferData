import { useRef, useState } from "react";
import { FaFileUpload } from "react-icons/fa";

import classes from "./FileUploadButton.module.css";

export interface FileUploadButtonProps {
	setFile: React.Dispatch<React.SetStateAction<File | null>>;
}

function FileUploadButton({ setFile }: FileUploadButtonProps) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [error, setError] = useState<string>("");

	const handleButtonClick = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const isFileValid = (file: File) => {
		if (file.name.split(".").pop() === "candata") {
			return true;
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setError("");

		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0];

			if (isFileValid(file)) {
				setFile(file);
			} else {
				setError("Invalid file type. Please upload .candata files only.");
			}
		}
	};

	return (
		<div className={classes.container}>
			<button className={classes.uploadBtn} onClick={handleButtonClick}>
				<FaFileUpload className={classes.icon} />
				<span>Upload CAN Bus Log</span>
			</button>
			<input
				className={classes.fileInput}
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept=".candata"
			/>
			{<div className={classes.errorText}>{error}</div>}
		</div>
	);
}

export default FileUploadButton;
