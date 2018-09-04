import { EventEmitter } from 'events';
import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import IVideoPlayer from '@signageos/front-display/es6/Video/IVideoPlayer';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import {
	PlayVideo,
	StopVideo,
	StopAllVideos,
	VideoStarted,
	VideoEnded,
	VideoStopped,
	VideoError,
	AllVideosStopped,
} from './bridgeVideoMessages';
import IVideo from '../../node_modules/@signageos/front-display/es6/Video/IVideo';

const eventEmitter = new EventEmitter();

export default function handleSocket(
	socket: ISocket,
	videoPlayer: IVideoPlayer,
) {
	forwardEventEmitterToSocket(socket);
	listenToVideoEventsFromClient(socket, videoPlayer);
}

function forwardEventEmitterToSocket(socket: ISocket) {
	const videoEventListener = async (event: { type: string, payload: any }) => {
		await socket.send(event.type, event.payload);
	};

	eventEmitter.on('video_event', videoEventListener);

	socket.on('disconnect', () => {
		eventEmitter.removeListener('video_event', videoEventListener);
	});
}

function listenToVideoEventsFromClient(socket: ISocket, videoPlayer: IVideoPlayer) {
	listenToPlayVideoEventFromClient(socket, videoPlayer);
	listenToStopVideoEventFromClient(socket, videoPlayer);
	listenToStopAllVideosEventFromClient(socket, videoPlayer);
}

function listenToPlayVideoEventFromClient(socket: ISocket, videoPlayer: IVideoPlayer) {
	socket.on(PlayVideo, async (message: PlayVideo) => {
		const { uri, x, y, width, height } = message;
		let video: IVideo;
		try {
			video = await videoPlayer.play(uri, x, y, width, height);
			video.on('ended', async (event: IVideoEvent) => {
				eventEmitter.emit('video_event', {
					type: VideoEnded,
					payload: { ...event.srcArguments },
				});
			});
			video.on('stopped', async (event: IVideoEvent) => {
				eventEmitter.emit('video_event', {
					type: VideoStopped,
					payload: { ...event.srcArguments },
				});
			});
			video.on('error', async (event: IVideoEvent) => {
				eventEmitter.emit('video_event', {
					type: VideoError,
					payload: {
						...event.srcArguments,
						data: event.data,
					},
				});
			});

			eventEmitter.emit('video_event', {
				type: VideoStarted,
				payload: {
					uri, x, y, width, height,
				},
			});
		} catch (error) {
			eventEmitter.emit('video_event', {
				type: VideoError,
				payload: {
					uri, x, y, width, height,
					data: { message: 'Failed to start video playback' },
				},
			});
		}
	});
}

function listenToStopVideoEventFromClient(socket: ISocket, videoPlayer: IVideoPlayer) {
	socket.on(StopVideo, async (message: StopVideo) => {
		const { uri, x, y, width, height } = message;
		try {
			await videoPlayer.stop(uri, x, y, width, height);

			eventEmitter.emit('video_event', {
				type: VideoStopped,
				payload: {
					uri, x, y, width, height,
				},
			});
		} catch (error) {
			eventEmitter.emit('video_event', {
				type: VideoError,
				payload: {
					uri, x, y, width, height,
					data: { message: 'Failed to stop video playback' },
				},
			});
		}
	});
}

function listenToStopAllVideosEventFromClient(socket: ISocket, videoPlayer: IVideoPlayer) {
	socket.on(StopAllVideos, async () => {
		await videoPlayer.clearAll();

		eventEmitter.emit('video_event', {
			type: AllVideosStopped,
			payload: {},
		});
	});
}
