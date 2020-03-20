const parameters = require('./parameters');
const fs = require('fs');

let config;
if (process.env.config_file) {
	const configFile = process.env.config_file;
	const configFileContents = fs.readFileSync(configFile).toString().trim();
	config = {};
	for (let line of configFileContents.split('\n')) {
		const [key, value] = line.split('=');
		config[key] = value;
	}
} else {
	config = process.env;
}

exports = module.exports = Object.assign({}, parameters, {
	platform: config.platform,
	paths: Object.assign({}, parameters.path, {
		servletPidFilesPath: config.servlet_pid_files_path,
	}),
	fileSystem: {
		root: config.fs_root_path,
		tmp: config.fs_tmp_path || '/tmp',
		appFiles: config.fs_app_files_path,
		system: config.fs_system_path,
	},
	video: Object.assign({}, parameters.video, {
		socket_root: '/tmp/signageos_server_' + process.pid,
	}),
	bundledServlet: config.bundled_servlet === '1'
		? {
			filePath: config.bundled_servlet_file_path,
			env: JSON.parse(config.bundled_servlet_env),
		}
		: null,
});
