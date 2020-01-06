import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import * as should from 'should';
import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import ServletRunner from '../../../src/Servlet/ServletRunner';
import wait from '@signageos/lib/dist/Timer/wait';

const fileSystem = {
	getAbsolutePath(filePath: IFilePath) {
		return path.join(__dirname, filePath.filePath);
	},
};

const pidFilePath = path.join(os.tmpdir(), 'signageos_display-linux_ServletRunnerSpec');

function createServletRunner() {
	return new ServletRunner(fileSystem as any, pidFilePath);
}

async function getTestScriptFilePath(): Promise<IFilePath> {
	return {
		storageUnit: {} as any,
		filePath: 'test_process.js',
	};
}

describe('Servlet.ServletRunner', function () {

	beforeEach('create empty pidfile directory', async () => {
		if (await fs.pathExists(pidFilePath)) {
			await fs.remove(pidFilePath);
		}
		await fs.ensureDir(pidFilePath);
	});

	after('delete pidfile directory', async () => {
		await fs.remove(pidFilePath);
	});

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

		it('should create a pidfile and then remove it', async function () {
			const servletRunner = createServletRunner();
			const testScriptFilePath = await getTestScriptFilePath();
			await servletRunner.run(testScriptFilePath);
			const pidfiles1 = await fs.readdir(pidFilePath);
			should(pidfiles1).have.length(1);
			await servletRunner.run(testScriptFilePath);
			const pidfiles2 = await fs.readdir(pidFilePath);
			should(pidfiles2).have.length(2);
			await servletRunner.closeAll();
			await wait(100);
			const pidfiles3 = await fs.readdir(pidFilePath);
			should(pidfiles3).have.length(0);
		});
	});
});
