const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const parameters = require('./config/parameters');
const {
	bundledAppletProcessEnvVariables,
	autoVerificationProcessEnvVariables,
} = require('./webpack.common.config');

module.exports = {
	mode: !process.env.NODE_ENV ? 'development' : 'production',
	name: 'client',
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
			...bundledAppletProcessEnvVariables,
			...autoVerificationProcessEnvVariables,
		}),
		new ExtractTextPlugin({ filename: "styles.css" }),
	],
	resolve: {
		extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.json']
	},
	module: {
		rules: [
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
					/node_modules\/(@signageos|hugport-*|cron|debug)/,
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
