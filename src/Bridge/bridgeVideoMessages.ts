import { VideoInput } from '../Driver/Display/IDisplay';

export const PrepareVideo = 'Video.PrepareVideo';
export interface PrepareVideo {
	type: typeof PrepareVideo;
	uri: string;
	x: number;
	y: number;
	width: number;
	height: number;
	isStream: boolean;
}

export const PlayVideo = 'Video.PlayVideo';
export interface PlayVideo {
	type: typeof PlayVideo;
	uri: string;
	x: number;
	y: number;
	width: number;
	height: number;
	isStream: boolean;
}

export const PauseVideo = 'Video.PauseVideo';
export interface PauseVideo {
	type: typeof PauseVideo;
	uri: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export const ResumeVideo = 'Video.ResumeVideo';
export interface ResumeVideo {
	type: typeof ResumeVideo;
	uri: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export const StopVideo = 'Video.StopVideo';
export interface StopVideo {
	type: typeof StopVideo;
	uri: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export const StopAllVideos = 'Video.StopAllVideos';
export interface StopAllVideos {
	type: typeof StopAllVideos;
}

export const VideoEnded = 'Video.VideoEnded';
export interface VideoEnded {
	type: typeof VideoEnded;
	uri: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export const VideoStopped = 'Video.VideoStopped';
export interface VideoStopped {
	type: typeof VideoStopped;
	uri: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export const VideoError = 'Video.VideoError';
export interface VideoError {
	type: typeof VideoError;
	uri: string;
	x: number;
	y: number;
	width: number;
	height: number;
	data?: any;
}

export const OpenInternalVideoInput = 'Video.OpenInternalVideoInput';
export interface OpenInternalVideoInput {
	type: typeof OpenInternalVideoInput;
	input: VideoInput;
}

export const CloseInternalVideoInput = 'Video.CloseInternalVideoInput';
export interface CloseInternalVideoInput {
	type: typeof CloseInternalVideoInput;
}
