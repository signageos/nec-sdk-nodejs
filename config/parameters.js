const { assign } = require('lodash');
const { detectModuleRootPath } = require('@signageos/lib/dist/Path/detector');
const packageConfig = require('../package.json');
const frontDisplayPackageConfig = require('@signageos/front-display/package.json');
const version = packageConfig.version;
const name = packageConfig.name;

const environment = process.env.NODE_ENV || 'dev';
const rootPath = detectModuleRootPath(packageConfig.name) || '..';
const configPath = rootPath + '/config';
const distPath = rootPath + '/dist';
const scriptsPath = rootPath + '/scripts';
const packagesPath = process.env.PACKAGES_PATH || rootPath + '/packages';

try {
	const localEnv = require('./env.' + environment + '.json');
	process.env = assign(process.env, localEnv);
} catch (e) {
	console.info(`Do not use override env.${environment}.json file`);
}

const ravenEnabled = typeof process.env.raven_enabled !== 'undefined' ? !!parseInt(process.env.raven_enabled) : false;

exports = module.exports = {
	environment,
	paths: {
		configPath,
		rootPath,
		distPath,
		scriptsPath,
		packagesPath,
	},
	app: {
		name,
		version,
	},
	frontDisplay: {
		sessionIdKey: 'sessionId',
		version: frontDisplayPackageConfig.version,
	},
	frontApplet: {
		prefix: 'hug',
	},
	raven: {
		enabled: ravenEnabled,
		dsn: process.env.raven_dsn,
		config: {
			allowSecretKey: true,
			release: version,
			environment,
			tags: {
				application: name,
				frontDisplayVersion: frontDisplayPackageConfig.version,
			},
		}
	},
	url: {
		baseUrl: process.env.base_url,
		socketUri: process.env.socket_uri,
		staticBaseUrl: process.env.static_base_url,
		uploadBaseUrl: process.env.upload_base_url,
		weinreServerUrl: process.env.weinre_server_url,
		synchronizerServerUrl: process.env.synchronizer_server_url,
	},
	server: {
		bridge_url: 'http://localhost:8080',
		file_system_url: 'http://localhost:8081',
	},
	fileSystem: {
		root: process.env.fs_root_path,
	},
};
