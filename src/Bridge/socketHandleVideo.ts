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
	socket.bindMessage(PrepareVideo, async (message: PrepareVideo) => {
		const { uri, x, y, width, height, isStream } = message;
		try {
			await videoPlayer.prepare(uri, x, y, width, height, isStream);
			await socket.sendMessage(VideoPrepared, {
				uri, x, y, width, height,
			});
		} catch (error) {
			await socket.sendMessage(VideoError, {
				uri, x, y, width, height,
				data: { message: 'Failed to prepare video' },
			});
		}
	});
}

function listenToPlayVideoEventFromClient(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	socket.bindMessage(PlayVideo, async (message: PlayVideo) => {
		const { uri, x, y, width, height } = message;
		try {
			await videoPlayer.play(uri, x, y, width, height, message.isStream);
			await socket.sendMessage(VideoStarted, {
				uri, x, y, width, height,
			});
		} catch (error) {
			await socket.sendMessage(VideoError, {
				uri, x, y, width, height,
				data: { message: 'Failed to start video playback' },
			});
		}
	});
}

function listenToStopVideoEventFromClient(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	socket.bindMessage(StopVideo, async (message: StopVideo) => {
		const { uri, x, y, width, height } = message;
		try {
			await videoPlayer.stop(uri, x, y, width, height);
			await socket.sendMessage(VideoStopped, {
				uri, x, y, width, height,
			});
		} catch (error) {
			await socket.sendMessage(VideoError, {
				uri, x, y, width, height,
				data: { message: 'Failed to stop video playback' },
			});
		}
	});
}

function listenToStopAllVideosEventFromClient(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	socket.bindMessage(StopAllVideos, async () => {
		await videoPlayer.clearAll();
		await socket.sendMessage(AllVideosStopped, {});
	});
}

function forwardVideoEventsToClient(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	const onEnded = async (event: IVideoEvent) => {
		await socket.sendMessage(VideoEnded, { ...event.srcArguments });
	};
	const onStopped = async (event: IVideoEvent) => {
		await socket.sendMessage(VideoStopped, { ...event.srcArguments });
	};
	const onError = async (event: IVideoEvent) => {
		await socket.sendMessage(VideoError, {
			...event.srcArguments,
			data: event.data,
		});
	};

	videoPlayer.addEventListener('ended', onEnded);
	videoPlayer.addEventListener('stopped', onStopped);
	videoPlayer.addEventListener('error', onError);

	socket.getDisconnectedPromise().then(() => {
		videoPlayer.removeEventListener('ended', onEnded);
		videoPlayer.removeEventListener('stopped', onStopped);
		videoPlayer.removeEventListener('error', onError);
	});
}
