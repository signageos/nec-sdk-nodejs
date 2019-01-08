export interface IFileDetails {
	createdAt: number;
	lastModifiedAt: number;
	sizeBytes: number;
	mimeType?: string;
}

export interface IVideoFileDetails {
	videoDurationMs?: number;
}

export type IExtendedFileDetails = IVideoFileDetails;
