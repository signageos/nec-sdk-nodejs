export default interface IFileSystem {
	ensureDirectory(directoryName: string): Promise<void>;
	/* @throws FileOrDirectoryNotFound */
	readFile(fileName: string): Promise<string>;
	/* @throws FileOrDirectoryNotFound */
	getFileChecksum(fileName: string, hashAlgorithm: string): Promise<string>;
	saveToFile(fileName: string, contents: string): Promise<void>;
	/* @throws FileOrDirectoryNotFound */
	deleteFile(fileName: string): Promise<void>;
	downloadFile(destinationPath: string, uri: string, headers?: { [key: string]: string }): Promise<void>;
	/* @throws FileOrDirectoryNotFound */
	uploadFile(fileName: string, formKey: string, uri: string, headers?: { [key: string]: string }): Promise<any>;
	/* @throws FileOrDirectoryNotFound */
	getFilesInDirectory(directory: string): Promise<string[]>;
	/* @throws FileOrDirectoryNotFound */
	readFilesInDirectory(directory: string): Promise<{ [filename: string]: string }>;
	getFullPath(relativePath: string): string;
	pathExists(path: string): Promise<boolean>;
	isFile(fileName: string): Promise<boolean>;
}

export class FileOrDirectoryNotFound extends Error {}
