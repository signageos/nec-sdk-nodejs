export const PlayVideo = 'Video.PlayVideo';
export interface PlayVideo {
	type: typeof PlayVideo;
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

export const VideoStarted = 'Video.VideoStarted';
export interface VideoStarted {
	type: typeof VideoStarted;
	uri: string;
	x: number;
	y: number;
	width: number;
	height: number;
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

export const AllVideosStopped = 'Video.AllVideosStopped';
export interface AllVideosStopped {
	type: typeof AllVideosStopped;
}
