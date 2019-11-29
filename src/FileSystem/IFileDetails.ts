export interface IFileDetails {
	createdAt: number;
	lastModifiedAt: number;
	sizeBytes: number;
	mimeType?: string;
}

export interface IVideoFileDetails {
	videoDurationMs?: number;
	videoResolution?: {
		width: number;
		height: number;
	};
	videoFramerate?: number;
	videoBitrate?: number;
	videoCodec?: string;
	videoThumbnailUriTemplate?: string;
}

export interface IImageFileDetails {
	imageThumbnailUriTemplate?: string;
}

export type IExtendedFileDetails = IVideoFileDetails & IImageFileDetails;
