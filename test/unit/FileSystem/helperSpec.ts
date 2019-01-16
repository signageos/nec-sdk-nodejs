import { trimSlashesAndDots } from '../../../src/FileSystem/helper';

describe('FileSystem.helper', function () {

	describe('trimSlashesAndDots', function () {

		const testCases = [
			{ before: '', after: '' },
			{ before: '.', after: '' },
			{ before: '/', after: '' },
			{ before: '.Test', after: '.Test' },
			{ before: 'aaa/..', after: '' },
			{ before: 'aaa/../bbb', after: 'bbb' },
			{ before: 'aaa', after: 'aaa' },
			{ before: '/aaa', after: 'aaa' },
			{ before: './aaa', after: 'aaa' },
			{ before: '././aaa', after: 'aaa' },
			{ before: './././aaa', after: 'aaa' },
			{ before: 'aaa/', after: 'aaa' },
			{ before: 'aaa/.', after: 'aaa' },
			{ before: 'aaa/./', after: 'aaa' },
			{ before: '/aaa/', after: 'aaa' },
			{ before: '/aaa/.', after: 'aaa' },
			{ before: '/aaa/./', after: 'aaa' },
			{ before: '/aaa/./.', after: 'aaa' },
			{ before: 'aaa////', after: 'aaa' },
			{ before: '////aaa', after: 'aaa' },
			{ before: 'aa///b/./c/.d///', after: 'aa/b/c/.d' },
			{ before: './././a/./../b', after: 'b' },
			{ before: 'a/./b/./c/./d', after: 'a/b/c/d' },
		];

		for (let testCase of testCases) {
			it(`should convert "${testCase.before}" to "${testCase.after}"`, function () {
				trimSlashesAndDots(testCase.before).should.equal(testCase.after);
			});
		}
	});
});
