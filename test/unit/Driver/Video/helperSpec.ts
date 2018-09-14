import {
	getLastFramePathFromVideoPath,
	convertToPortrait,
	convertToPortraitFlipped,
	convertToLandscapeFlipped,
} from '../../../../src/Driver/Video/helper';

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

	describe('convertToPortrait', function () {

		const testCases = [
			{
				input: { x: 0, y: 0, width: 1080, height: 1920 },
				expected: { x: 0, y: 0, width: 1920, height: 1080 },
			},
			{
				input: { x: 200, y: 100, width: 800, height: 600 },
				expected: { x: 1220, y: 200, width: 600, height: 800 },
			},
			{
				input: { x: 0, y: 0, width: 800, height: 600 },
				expected: { x: 1320, y: 0, width: 600, height: 800 },
			},
			{
				input: { x: 0, y: 520, width: 800, height: 1400 },
				expected: { x: 0, y: 0, width: 1400, height: 800 },
			},
		];

		for (let testCase of testCases) {
			const input = testCase.input;
			const expected = testCase.expected;
			const inputString = [input.x, input.y, input.width, input.height].join(',');
			const expectedString = [expected.x, expected.y, expected.width, expected.height].join(',');

			it(`should convert (${inputString}) to (${expectedString})`, function () {
				const window: any = { innerWidth: 1920, innerHeight: 1080 };
				const actual = convertToPortrait(window, input.x, input.y, input.width, input.height);
				actual.should.deepEqual(expected);
			});
		}
	});

	describe('convertToPortraitFlipped', function () {

		const testCases = [
			{
				input: { x: 0, y: 0, width: 1080, height: 1920 },
				expected: { x: 0, y: 0, width: 1920, height: 1080 },
			},
			{
				input: { x: 200, y: 100, width: 800, height: 600 },
				expected: { x: 100, y: 80, width: 600, height: 800 },
			},
			{
				input: { x: 0, y: 0, width: 800, height: 600 },
				expected: { x: 0, y: 280, width: 600, height: 800 },
			},
			{
				input: { x: 280, y: 0, width: 800, height: 600 },
				expected: { x: 0, y: 0, width: 600, height: 800 },
			},
		];

		for (let testCase of testCases) {
			const input = testCase.input;
			const expected = testCase.expected;
			const inputString = [input.x, input.y, input.width, input.height].join(',');
			const expectedString = [expected.x, expected.y, expected.width, expected.height].join(',');

			it(`should convert (${inputString}) to (${expectedString})`, function () {
				const window: any = { innerWidth: 1920, innerHeight: 1080 };
				const actual = convertToPortraitFlipped(window, input.x, input.y, input.width, input.height);
				actual.should.deepEqual(expected);
			});
		}
	});

	describe('convertToLandscapeFlipped', function () {

		const testCases = [
			{
				input: { x: 0, y: 0, width: 1920, height: 1080 },
				expected: { x: 0, y: 0, width: 1920, height: 1080 },
			},
			{
				input: { x: 200, y: 100, width: 800, height: 600 },
				expected: { x: 920, y: 380, width: 800, height: 600 },
			},
			{
				input: { x: 0, y: 0, width: 800, height: 600 },
				expected: { x: 1120, y: 480, width: 800, height: 600 },
			},
			{
				input: { x: 1120, y: 480, width: 800, height: 600 },
				expected: { x: 0, y: 0, width: 800, height: 600 },
			},
		];

		for (let testCase of testCases) {
			const input = testCase.input;
			const expected = testCase.expected;
			const inputString = [input.x, input.y, input.width, input.height].join(',');
			const expectedString = [expected.x, expected.y, expected.width, expected.height].join(',');

			it(`should convert (${inputString}) to (${expectedString})`, function () {
				const window: any = { innerWidth: 1920, innerHeight: 1080 };
				const actual = convertToLandscapeFlipped(window, input.x, input.y, input.width, input.height);
				actual.should.deepEqual(expected);
			});
		}
	});
});
