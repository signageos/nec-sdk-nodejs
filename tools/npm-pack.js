const NpmPackPlugin = require('@signageos/lib/dist/Webpack/NpmPackPlugin').default;
const parameters = require('../config/parameters');

const version = process.argv[2];

if (!version) {
	console.error('missing version');
	process.exit(1);
}

const npmPackPlugin = new NpmPackPlugin({
	name: parameters.app.name,
	environment: parameters.environment,
	rootPath: parameters.paths.rootPath,
	packagesPath: parameters.paths.packagesPath,
	dependencies: ['@signageos/front-display'],
	getVersion: () => version,
});

const mockCompiler = {
	plugin(name, callback) {
		if (name === 'done') {
			callback();
		}
	}
};

npmPackPlugin.apply(mockCompiler);
