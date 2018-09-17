import { EventEmitter } from "events";
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import StreamProtocol from '@signageos/front-display/es6/Stream/StreamProtocol';
import BridgeVideoPlayer from '../../../../src/Driver/Video/BridgeVideoPlayer';
import BridgeStreamPlayer from '../../../../src/Driver/Video/BridgeStreamPlayer';
import { convertToPortrait } from '../../../../src/Driver/Video/helper';
import {
	PlayVideo,
	PrepareVideo,
	VideoPrepared,
	VideoStarted,
} from '../../../../src/Bridge/bridgeVideoMessages';

export async function prepareVideo(
	window: Window,
	bridgeVideoPlayer: BridgeVideoPlayer,
	socketClient: EventEmitter,
	uri: string,
	uriRelative: string,
	x: number,
	y: number,
	width: number,
	height: number,
	orientation: Orientation = Orientation.LANDSCAPE,
) {
	const coordinates = orientation === Orientation.PORTRAIT
		? convertToPortrait(window, x, y, width, height)
		: { x, y, width, height };

	const prepareVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
		socketClient.once(PrepareVideo, (event: { uri: string; x: number; y: number; width: number; height: number }) => {
			if (event.uri === uriRelative &&
				event.x === coordinates.x &&
				event.y === coordinates.y &&
				event.width === coordinates.width &&
				event.height === coordinates.height
			) {
				resolve();
			} else {
				reject(new Error('Attempt to play video with unexpected arguments'));
			}
		});
	});

	const prepareVideoPromise = bridgeVideoPlayer.prepare(uri, x, y, width, height);
	await prepareVideoEmittedPromise;
	socketClient.emit(VideoPrepared, {
		uri: uriRelative,
		x: coordinates.x,
		y: coordinates.y,
		width: coordinates.width,
		height: coordinates.height,
	});
	return await prepareVideoPromise;
}

export async function playVideo(
	window: Window,
	bridgeVideoPlayer: BridgeVideoPlayer,
	socketClient: EventEmitter,
	uri: string,
	uriRelative: string,
	x: number,
	y: number,
	width: number,
	height: number,
	orientation: Orientation,
) {
	await prepareVideo(window, bridgeVideoPlayer, socketClient, uri, uriRelative, x, y, width, height, orientation);

	const coordinates = orientation === Orientation.PORTRAIT
		? convertToPortrait(window, x, y, width, height)
		: { x, y, width, height };

	const playVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
		socketClient.once(PlayVideo, (event: PlayVideo) => {
			if (event.uri === uriRelative &&
				event.x === coordinates.x &&
				event.y === coordinates.y &&
				event.width === coordinates.width &&
				event.height === coordinates.height &&
				event.orientation === orientation &&
				!event.isStream
			) {
				resolve();
			} else {
				reject(new Error('Attempt to play video with unexpected arguments'));
			}
		});
	});

	const playVideoPromise = bridgeVideoPlayer.play(uri, x, y, width, height);
	await playVideoEmittedPromise;
	socketClient.emit(VideoStarted, {
		uri: uriRelative,
		x: coordinates.x,
		y: coordinates.y,
		width: coordinates.width,
		height: coordinates.height,
	});
	return await playVideoPromise;
}

export async function playStream(
	window: Window,
	bridgeStreamPlayer: BridgeStreamPlayer,
	socketClient: EventEmitter,
	uri: string,
	x: number,
	y: number,
	width: number,
	height: number,
	protocol: StreamProtocol,
	orientation: Orientation,
) {
	const coordinates = orientation === Orientation.PORTRAIT
		? convertToPortrait(window, x, y, width, height)
		: { x, y, width, height };

	const playVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
		socketClient.once(PlayVideo, (event: PlayVideo) => {
			if (event.uri === uri &&
				event.x === coordinates.x &&
				event.y === coordinates.y &&
				event.width === coordinates.width &&
				event.height === coordinates.height &&
				event.orientation === orientation &&
				event.isStream
			) {
				resolve();
			} else {
				reject(new Error('Attempt to play stream with unexpected arguments'));
			}
		});
	});

	const playVideoPromise = bridgeStreamPlayer.play(uri, x, y, width, height, protocol);
	await playVideoEmittedPromise;
	socketClient.emit(VideoStarted, {
		uri,
		x: coordinates.x,
		y: coordinates.y,
		width: coordinates.width,
		height: coordinates.height,
	});
	return await playVideoPromise;
}
