export default interface IFileSystem {
	/* @throws FileOrDirectoryNotFound */
	readFile(fileName: string): Promise<string>;
	saveToFile(fileName: string, contents: string): Promise<void>;
	/* @throws FileOrDirectoryNotFound */
	deleteFile(fileName: string): Promise<void>;
	downloadFile(destinationPath: string, uri: string, headers?: { [key: string]: string }): Promise<void>;
	/* @throws FileOrDirectoryNotFound */
	getFilesInDirectory(directory: string): Promise<string[]>;
	/* @throws FileOrDirectoryNotFound */
	readFilesInDirectory(directory: string): Promise<{ [filename: string]: string }>;
	getFullPath(relativePath: string): string;
	pathExists(path: string): Promise<boolean>;
	isFile(fileName: string): Promise<boolean>;
}

export class FileOrDirectoryNotFound extends Error {}
