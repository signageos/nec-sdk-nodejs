export interface IFileDetails {
	createdAt: number;
	lastModifiedAt: number;
	sizeBytes: number;
	mimeType?: string;
}

export interface IVideoFileDetails extends IFileDetails {
	videoDurationMs?: number;
}
