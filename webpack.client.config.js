const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const NpmPackPlugin = require('@signageos/lib/dist/Webpack/NpmPackPlugin').default;
const parameters = require('./config/parameters');
const { exec } = require('child_process');

module.exports = {
	entry: {
		bundle: ['babel-polyfill', './src/client'],
		overlay: './src/overlay',
	},
	output: {
		path: parameters.paths.distPath + '/client',
		filename: '[name].js',
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
			'process.env.weinre_server_url': '"' + parameters.url.weinreServerUrl + '"',
			'process.env.synchronizer_server_url': '"' + parameters.url.synchronizerServerUrl + '"',
		}),
		new ExtractTextPlugin({ filename: "styles.css" }),
		new NpmPackPlugin({
			name: parameters.app.name,
			environment: parameters.environment,
			rootPath: parameters.paths.rootPath,
			packagesPath: parameters.paths.packagesPath,
			dependencies: ['@signageos/front-display'],
		}),
	],
	resolve: {
		extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.json']
	},
	module: {
		loaders: [
			{ test: /\.json$/, loader: 'json-loader' },
			{ test: /\.tsx?$/, loader: 'awesome-typescript-loader?useCache&forceIsolatedModules&cacheDirectory=cache' },
			{ test: /\.sass$/, use: ExtractTextPlugin.extract({
				fallback: 'style-loader',
				use: ['css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]', 'sass-loader?sourceMap'],
			}) },
			{ test: /\.svg$/, loader: 'babel-loader!svg-react-loader' },
			{
				test: /\.(t|j)sx?$/,
				include: [
					path.resolve(parameters.paths.rootPath, 'config'),
					path.resolve(parameters.paths.rootPath, 'src'),
					/node_modules\/(@signageos|hugport-*|cron)/,
				],
				loader: 'babel-loader',
				query: {
					presets: [require.resolve('babel-preset-es2015')],
				},
				enforce: "post",
			},
			{ test: /\.css$/, loader: 'style-loader!css-loader' },
			{ test: /\.(png|woff|woff2|eot|ttf)$/, loader: 'url-loader?limit=100000' },
		],
	}
}

switch (parameters.environment) {
	case 'production':
		module.exports.plugins.push(new webpack.optimize.UglifyJsPlugin());
		break;
	case 'test':
		break;
	case 'dev':
		break;
	default:
		console.warn('Unknown environment ' + environment);
}
