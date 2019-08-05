import * as path from 'path';
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import ServletRunner from '../../../src/Servlet/ServletRunner';
import wait from '@signageos/lib/dist/Timer/wait';

const fileSystem = {
	getAbsolutePath(filePath: IFilePath) {
		return path.join(__dirname, filePath.filePath);
	},
};

function createServletRunner() {
	return new ServletRunner(fileSystem as any);
}

async function getTestScriptFilePath(): Promise<IFilePath> {
	return {
		storageUnit: {} as any,
		filePath: 'test_process.js',
	};
}

describe('Servlet.ServletRunner', function () {

	describe('run and closeAll', function () {

		it('should run child node processes and then close them all', async function () {
			const servletRunner = createServletRunner();
			servletRunner.getRunningCount().should.equal(0);
			const testScriptFilePath = await getTestScriptFilePath();
			await servletRunner.run(testScriptFilePath);
			servletRunner.getRunningCount().should.equal(1);
			await servletRunner.run(testScriptFilePath);
			servletRunner.getRunningCount().should.equal(2);
			await servletRunner.closeAll();
			await wait(100);
			servletRunner.getRunningCount().should.equal(0);
		});
	});
});
