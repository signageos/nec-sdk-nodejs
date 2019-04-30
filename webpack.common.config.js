const parameters = require('./config/parameters');

let bundledAppletProcessEnvVariables;
if (parameters.bundledApplet) {
	bundledAppletProcessEnvVariables = {
		'process.env.bundled_applet': '"1"',
		'process.env.bundled_applet_version': '"' + parameters.bundledApplet.version + '"',
		'process.env.bundled_applet_front_applet_version': '"' + parameters.bundledApplet.frontAppletVersion + '"',
		'process.env.bundled_applet_checksum': '"' + parameters.bundledApplet.checksum + '"',
		'process.env.bundled_applet_binary_file': '"' + parameters.bundledApplet.binaryFile + '"',
		'process.env.bundled_applet_front_applet_binary_file': '"' + parameters.bundledApplet.frontAppletBinaryFile + '"',
	};
} else {
	bundledAppletProcessEnvVariables = {
		'process.env.bundled_applet': '"0"',
	};
}

module.exports = {
	bundledAppletProcessEnvVariables,
};
