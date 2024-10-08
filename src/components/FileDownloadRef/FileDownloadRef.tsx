import classes from "./FileDownloadRef.module.css";

interface FileDownloadRefProps {
	downloadRef: React.RefObject<HTMLAnchorElement>;
	fileName: string;
}

function FileDownloadRef({ downloadRef, fileName }: FileDownloadRefProps) {
	return <a className={classes.downloadLink} ref={downloadRef} download={fileName} />;
}

export default FileDownloadRef;
