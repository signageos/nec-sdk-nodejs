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

let bundledApplet;
let autoVerification;
if (typeof window !== 'undefined') {
	if (typeof window.__SOS_BUNDLED_APPLET !== 'undefined') {
		bundledApplet = window.__SOS_BUNDLED_APPLET;
	}
	if (typeof window.__SOS_AUTO_VERIFICATION !== 'undefined') {
		autoVerification = window.__SOS_AUTO_VERIFICATION;
	}
} else {
	try {
		// if I don't use eval, webpack will replace it with something like "throw new Error('Cannot find module \"./applet.json\"')"
		const bundledAppletConfig = eval("require('./applet.json')");
		bundledApplet = bundledAppletConfig.applet;
		autoVerification = bundledAppletConfig.autoVerification;
	} catch (error) {
		bundledApplet = process.env.bundledApplet ? JSON.parse(process.env.bundledApplet) : undefined;
		autoVerification = process.env.autoVerification ? JSON.parse(process.env.autoVerification) : undefined;
	}
}

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
	video: {
		max_count: 4,
	},
	bundledApplet,
	autoVerification,
});
