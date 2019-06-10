const { getNodeModulesExternals } = require('@signageos/lib/tools/nodeModulesHelper');
const config = require('./webpack.server.config');
const parameters = require('./config/parameters');

module.exports = {
	...config,
	target: 'node',
	node: {
		__filename: false,
		__dirname: false,
	},
	externals: getNodeModulesExternals(parameters.paths.rootPath),
};
