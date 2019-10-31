export interface IFileDetails {
	createdAt: number;
	lastModifiedAt: number;
	sizeBytes: number;
	mimeType?: string;
}

export interface IVideoFileDetails {
	videoDurationMs?: number;
}

export interface IImageFileDetails {
	imageThumbnailUriTemplate?: string;
}

export type IExtendedFileDetails = IVideoFileDetails & IImageFileDetails;
