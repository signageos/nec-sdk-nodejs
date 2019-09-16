const basicParameters = require('./basic_parameters');
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
const packagesPath = process.env.PACKAGES_PATH || rootPath + '/packages';

try {
	const localEnv = require('./env.' + environment + '.json');
	process.env = assign(process.env, localEnv);
} catch (e) {
	console.info(`Do not use override env.${environment}.json file`);
}

const ravenEnabled = typeof process.env.raven_enabled !== 'undefined' ? !!parseInt(process.env.raven_enabled) : false;

exports = module.exports = Object.assign({}, basicParameters, {
	environment,
	paths: {
		configPath,
		rootPath,
		distPath,
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
	fileSystem: {
		root: process.env.fs_root_path,
		tmp: process.env.fs_tmp_path || '/tmp',
		appFiles: process.env.fs_app_files_path,
		system: process.env.fs_system_path,
	},
	video: {
		socket_root: '/tmp',
		max_count: 4,
	},
	bundledApplet: process.env.bundled_applet === '1'
		? {
			version: process.env.bundled_applet_version,
			frontAppletVersion: process.env.bundled_applet_front_applet_version,
			checksum: process.env.bundled_applet_checksum,
			binaryFile: process.env.bundled_applet_binary_file,
			frontAppletBinaryFile: process.env.bundled_applet_front_applet_binary_file,
		}
		: null,
	bundledServlet: process.env.bundled_servlet === '1'
		? {
			filePath: process.env.bundled_servlet_file_path,
			env: JSON.parse(process.env.bundled_servlet_env),
		}
		: null,
	autoVerification: process.env.auto_verification_organization_uid
		? {
			organizationUid: process.env.auto_verification_organization_uid,
		}
		: null,
});
