import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import {
	PrepareVideo,
	PlayVideo,
	StopVideo,
	StopAllVideos,
	VideoEnded,
	VideoStopped,
	VideoError,
	PauseVideo,
	ResumeVideo,
} from './bridgeVideoMessages';
import IServerVideoPlayer from '../Driver/Video/IServerVideoPlayer';
import { MessageType } from './BridgeClient';
import IBridgeMessage from './IBridgeMessage';
import * as Debug from 'debug';
const debug = Debug('@signageos/display-linux:Bridge:socketHandleVideo');

export default function socketHandleVideo(
	socket: ISocket,
	videoPlayer: IServerVideoPlayer,
) {
	bindVideoMessages(socket, videoPlayer);
	forwardVideoEventsToClient(socket, videoPlayer);
}

function bindVideoMessages(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	socket.bindMessage('message.' + MessageType.VIDEO, async (message: IBridgeMessage<any>) => {
		debug('video message received', message);
		try {
			await handleVideoMessage(videoPlayer, message.message);
			debug('video message success', message);
			await socket.sendMessageExpectingResponse(message.invocationUid, { success: true, response: {} });
		} catch (error) {
			debug('video message error', message);
			await socket.sendMessageExpectingResponse(message.invocationUid, { success: false });
		}
	});
}

async function handleVideoMessage(
	videoPlayer: IServerVideoPlayer,
	message: PrepareVideo | PlayVideo | PauseVideo | ResumeVideo | StopVideo | StopAllVideos,
) {
	switch (message.type) {
		case PrepareVideo:
			await videoPlayer.prepare(
				message.uri,
				message.x,
				message.y,
				message.width,
				message.height,
				message.isStream,
				message.options,
			);
			break;
		case PlayVideo:
			await videoPlayer.play(message.uri, message.x, message.y, message.width, message.height, message.isStream);
			break;
		case PauseVideo:
			await videoPlayer.pause(message.uri, message.x, message.y, message.width, message.height);
			break;
		case ResumeVideo:
			await videoPlayer.resume(message.uri, message.x, message.y, message.width, message.height);
			break;
		case StopVideo:
			await videoPlayer.stop(message.uri, message.x, message.y, message.width, message.height);
			break;
		case StopAllVideos:
			await videoPlayer.clearAll();
			break;
		default:
			throw new Error('invalid video message');
	}
}

function forwardVideoEventsToClient(socket: ISocket, videoPlayer: IServerVideoPlayer) {
	const onEnded = async (event: IVideoEvent) => {
		debug('video ended', event);
		await socket.sendMessageExpectingResponse(VideoEnded, { ...event.srcArguments });
	};
	const onStopped = async (event: IVideoEvent) => {
		debug('video stopped', event);
		await socket.sendMessageExpectingResponse(VideoStopped, { ...event.srcArguments });
	};
	const onError = async (event: IVideoEvent) => {
		debug('video error', event);
		await socket.sendMessageExpectingResponse(VideoError, {
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
