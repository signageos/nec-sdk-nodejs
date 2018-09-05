import { getLastFramePathFromVideoPath } from '../../../../src/Driver/Video/helper';

describe('Driver.Video.helper', function () {

	describe('getLastFramePathFromVideoPath', function () {

		it('should return correct last frame path for a given video path', function () {
			getLastFramePathFromVideoPath('front/video1.mp4')
				.should.equal('front/video1.mp4.last_frame.bmp');

			getLastFramePathFromVideoPath('front/video2.test.mp4')
				.should.equal('front/video2.test.mp4.last_frame.bmp');

			getLastFramePathFromVideoPath('http://localhost:8081/front/video3.mp4')
				.should.equal('http://localhost:8081/front/video3.mp4.last_frame.bmp');

			getLastFramePathFromVideoPath('/var/test/front/video4.mov')
				.should.equal('/var/test/front/video4.mov.last_frame.bmp');

			getLastFramePathFromVideoPath('/var/test/front/video5')
				.should.equal('/var/test/front/video5.last_frame.bmp');
		});
	});
});
