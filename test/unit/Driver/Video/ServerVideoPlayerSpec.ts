import * as sinon from 'sinon';
import ServerVideoPlayer from '../../../../src/Driver/Video/ServerVideoPlayer';
import MockServerVideo from './MockServerVideo';

describe('Driver.Video.ServerVideoPlayer', function () {

	describe('constructor', function () {

		it('should create number of videos defined in the arguments', function () {
			const createVideo = sinon.stub().returns({
				addEventListener: sinon.spy(),
			});
			const videoPlayer = new ServerVideoPlayer(3, createVideo);
			videoPlayer.should.be.ok();
			createVideo.callCount.should.equal(3);
			createVideo.getCall(0).args[0].should.equal('video_0');
			createVideo.getCall(1).args[0].should.equal('video_1');
			createVideo.getCall(2).args[0].should.equal('video_2');
		});
	});

	describe('prepare', function () {

		const order = ['first', 'second', 'third'];
		for (let i = 0; i < 3; i++) {
			it(`should prepare ${order[i]} of 3 video instances when it's idle`, async function () {
				let videoCounter = 0;
				let prepareCalled = false;
				const createVideo = () => {
					const idle = videoCounter === i;
					videoCounter++;
					return {
						isIdle: () => idle,
						prepare: async (
							uri: string,
							x: number,
							y: number,
							width: number,
							height: number,
							isStream: boolean,
						) => {
							if (!idle) {
								throw new Error('prepare called on a wrong instance');
							}

							prepareCalled = true;
							uri.should.equal('video1');
							x.should.equal(0);
							y.should.equal(1);
							width.should.equal(1920);
							height.should.equal(1080);
							isStream.should.be.true();
						},
						addEventListener: sinon.spy(),
					};
				};

				const videoPlayer = new ServerVideoPlayer(3, createVideo as any);
				await videoPlayer.prepare('video1', 0, 1, 1920, 1080, true);
				prepareCalled.should.be.true();
			});
		}

		it('should throw error if there are no idle video players available', async function () {
			const createVideo = () => ({
				isIdle: () => false,
				addEventListener: sinon.spy(),
			});
			const videoPlayer = new ServerVideoPlayer(5, createVideo as any);
			await videoPlayer.prepare('video1', 0, 1, 1920, 1080, true)
				.should.be.rejected();
		});
	});

	describe('play', function () {

		const order = ['first', 'second', 'third'];
		for (let i = 0; i < 3; i++) {
			it(`should play ${order[i]} video player in the list because it's prepared`, async function () {
				const videos: MockServerVideo[] = [];
				const createVideo = () => {
					const video = new MockServerVideo();
					videos.push(video);
					return video;
				};

				const videoPlayer = new ServerVideoPlayer(3, createVideo);
				await videos[i].prepare('video1', 0, 1, 1920, 1080, true);
				await videoPlayer.play('video1', 0, 1, 1920, 1080, true);
				videos[i].isPlaying().should.be.true();
			});
		}

		it('should play second video player in the list because it\'s idle and others are playing', async function () {
			const videos: MockServerVideo[] = [];
			const createVideo = () => {
				const video = new MockServerVideo();
				videos.push(video);
				return video;
			};

			const videoPlayer = new ServerVideoPlayer(3, createVideo);
			await videos[0].prepare('video1', 0, 1, 1920, 1080, true);
			await videos[0].play();
			await videos[2].prepare('video2', 0, 1, 1920, 1080, true);
			await videos[2].play();
			await videoPlayer.play('video3', 0, 1, 1920, 1080, true);
			await videos[1].isPlaying().should.be.true();
		});

		it('should postpone play video when there are no available resources left currently', async function () {
			const videos: MockServerVideo[] = [];
			const createVideo = () => {
				const video = new MockServerVideo();
				videos.push(video);
				return video;
			};

			const videoPlayer = new ServerVideoPlayer(3, createVideo);
			await videos[0].prepare('video1', 0, 1, 1920, 1080, true);
			await videos[0].play();
			await videos[1].prepare('video2', 0, 1, 1920, 1080, true);
			await videos[1].play();
			await videos[2].prepare('video3', 0, 1, 1920, 1080, true);
			await videos[2].play();
			const playVideo4Promise = videoPlayer.play('video4', 0, 1, 1920, 1080, true);
			await videos[0].stop();
			await playVideo4Promise;
		});
	});

	describe('stop', function () {

		it('should stop video that\'s playing with the given arguments', async function () {
			const videos: MockServerVideo[] = [];
			const createVideo = () => {
				const video = new MockServerVideo();
				videos.push(video);
				return video;
			};

			const videoPlayer = new ServerVideoPlayer(3, createVideo);

			await videos[0].prepare('video1', 0, 1, 1920, 1080, true);
			await videos[0].play();
			videos[0].isPlaying();

			await videos[1].prepare('video2', 0, 1, 1920, 1080, true);
			await videos[1].play();
			videos[1].isPlaying();

			await videos[2].prepare('video3', 0, 1, 1920, 1080, true);
			await videos[2].play();
			videos[2].isPlaying();

			await videoPlayer.stop('video1', 0, 1, 1920, 1080);

			videos[0].isPlaying();
			videos[1].isIdle();
			videos[2].isPlaying();
		});
	});

	describe('clearAll', function () {

		it('should stop all playing videos', async function () {
			const videos: MockServerVideo[] = [];
			const createVideo = () => {
				const video = new MockServerVideo();
				videos.push(video);
				return video;
			};

			const videoPlayer = new ServerVideoPlayer(3, createVideo);

			await videos[0].prepare('video1', 0, 1, 1920, 1080, true);
			await videos[0].play();
			videos[0].isPlaying();

			await videos[1].prepare('video2', 0, 1, 1920, 1080, true);
			await videos[1].play();
			videos[1].isPlaying();

			await videos[2].prepare('video3', 0, 1, 1920, 1080, true);
			await videos[2].play();
			videos[2].isPlaying();

			await videoPlayer.clearAll();

			videos[0].isIdle();
			videos[1].isIdle();
			videos[2].isIdle();
		});
	});
});
