import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import {
	PrepareVideo,
	PlayVideo,
	StopVideo,
	StopAllVideos,
	VideoPrepared,
	VideoStarted,
	VideoEnded,
	VideoStopped,
	VideoError,
	AllVideosStopped,
} from './bridgeVideoMessages';
import IServerVideoPlayer from '../Driver/Video/IServerVideoPlayer';

export default function socketHandleVideo(
	socket: ISocket,
	videoPlayer: IServerVideoPlayer,
) {
	listenToVideoEventsFromClient(socket, videoPlayer);
	forwardVideoEventsToClient(socket, videoPlayer);
}

function listenToVideoEventsFromClient(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	listenToPrepareVideoEventFromClient(socket, videoPlayer);
	listenToPlayVideoEventFromClient(socket, videoPlayer);
	listenToStopVideoEventFromClient(socket, videoPlayer);
	listenToStopAllVideosEventFromClient(socket, videoPlayer);
}

function listenToPrepareVideoEventFromClient(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	socket.on(PrepareVideo, async (message: PrepareVideo) => {
		const { uri, x, y, width, height, orientation, isStream } = message;
		try {
			await videoPlayer.prepare(uri, x, y, width, height, orientation, isStream);
			await socket.send(VideoPrepared, {
				uri, x, y, width, height,
			});
		} catch (error) {
			await socket.send(VideoError, {
				uri, x, y, width, height,
				data: { message: 'Failed to prepare video' },
			});
		}
	});
}

function listenToPlayVideoEventFromClient(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	socket.on(PlayVideo, async (message: PlayVideo) => {
		const { uri, x, y, width, height } = message;
		try {
			await videoPlayer.play(uri, x, y, width, height, message.orientation, message.isStream);
			await socket.send(VideoStarted, {
				uri, x, y, width, height,
			});
		} catch (error) {
			await socket.send(VideoError, {
				uri, x, y, width, height,
				data: { message: 'Failed to start video playback' },
			});
		}
	});
}

function listenToStopVideoEventFromClient(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	socket.on(StopVideo, async (message: StopVideo) => {
		const { uri, x, y, width, height } = message;
		try {
			await videoPlayer.stop(uri, x, y, width, height);
			await socket.send(VideoStopped, {
				uri, x, y, width, height,
			});
		} catch (error) {
			await socket.send(VideoError, {
				uri, x, y, width, height,
				data: { message: 'Failed to stop video playback' },
			});
		}
	});
}

function listenToStopAllVideosEventFromClient(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	socket.on(StopAllVideos, async () => {
		await videoPlayer.clearAll();
		await socket.send(AllVideosStopped, {});
	});
}

function forwardVideoEventsToClient(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	const onEnded = async (event: IVideoEvent) => {
		await socket.send(VideoEnded, { ...event.srcArguments });
	};
	const onStopped = async (event: IVideoEvent) => {
		await socket.send(VideoStopped, { ...event.srcArguments });
	};
	const onError = async (event: IVideoEvent) => {
		await socket.send(VideoError, {
			...event.srcArguments,
			data: event.data,
		});
	};

	videoPlayer.addEventListener('ended', onEnded);
	videoPlayer.addEventListener('stopped', onStopped);
	videoPlayer.addEventListener('error', onError);

	socket.on('disconnect', () => {
		videoPlayer.removeEventListener('ended', onEnded);
		videoPlayer.removeEventListener('stopped', onStopped);
		videoPlayer.removeEventListener('error', onError);
	});
}
