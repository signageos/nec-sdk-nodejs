export default interface IFileSystem {
	/* @throws FileOrDirectoryNotFound */
	readFile(fileName: string): Promise<string>;
	saveToFile(fileName: string, contents: string): Promise<void>;
	deleteFile(fileName: string): Promise<void>;
	/* @throws FileOrDirectoryNotFound */
	getFilesInDirectory(directory: string): Promise<string[]>;
	/* @throws FileOrDirectoryNotFound */
	readFilesInDirectory(directory: string): Promise<{ [filename: string]: string }>;
}

export class FileOrDirectoryNotFound extends Error {}
