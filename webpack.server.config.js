const webpack = require('webpack');
const { getNodeModulesExternals } = require('@signageos/lib/tools/nodeModulesHelper');
const NpmPackPlugin = require('@signageos/lib/dist/Webpack/NpmPackPlugin').default;
const parameters = require('./config/parameters');

module.exports = {
	entry: './src/server',
	target: 'node',
	node: {
		__filename: true,
		__dirname: true,
	},
	output: {
		path: parameters.paths.distPath + '/server',
		filename: 'server.js',
		publicPath: '/',
	},
	devtool: 'source-map',
	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': '"' + parameters.environment + '"',
			'process.env.raven_dsn': '"' + parameters.raven.dsn + '"',
			'process.env.raven_enabled': '"' + parameters.raven.enabled + '"',
			'process.env.base_url': '"' + parameters.url.baseUrl + '"',
			'process.env.socket_uri': '"' + parameters.url.socketUri + '"',
			'process.env.static_base_url': '"' + parameters.url.staticBaseUrl + '"',
			'process.env.upload_base_url': '"' + parameters.url.uploadBaseUrl + '"',
		}),
		new NpmPackPlugin({
			name: parameters.app.name,
			environment: parameters.environment,
			rootPath: parameters.paths.rootPath,
			packagesPath: parameters.paths.packagesPath,
			dependencies: ['@signageos/front-display'],
		}),
	],
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.json']
	},
	module: {
		rules: [
			{ test: /\.json$/, loader: 'json-loader' },
			{
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader',
				options: {
					useCache: true,
					cacheDirectory: 'cache',
					forceIsolatedModules: true,
					reportFiles: [
						'src/**/*.{ts,tsx}',
						'test/**/*.{ts,tsx}',
					],
				},
			},
		],
	},
	externals: getNodeModulesExternals(parameters.paths.rootPath)
}

switch (parameters.environment) {
	case 'production':
		break;
	case 'test':
		break;
	case 'dev':
		break;
	default:
		console.warn('Unknown environment ' + environment);
}
