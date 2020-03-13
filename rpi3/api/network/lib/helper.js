
const child_process = require('child_process');

exports.runScript = function (command, args) {
	return new Promise((resolve, reject) => {
		let data = '';
		const childProcess = child_process.spawn(command, args);
		childProcess.stdout.on('data', (chunk) => data += chunk);
		childProcess.stdout.pipe(process.stdout);
		childProcess.stderr.pipe(process.stderr);
		childProcess.on('error', reject);
		childProcess.on('exit', () => resolve(data));
	});
}

exports.getAllInterfacesNames = async function() {
	const ifacesOutput = await exports.runScript('ifconfig', ['-a']);
	const lines = ifacesOutput.split('\n');
	const ifaces = lines.map((line) => line.split(/\s+/)[0]).filter((lineColumn) => lineColumn);
	return ifaces;
}

exports.netmaskToCidrNumber = function (netmask) {
	const splited = netmask.split('.');
	const binary = splited.map((segment) => parseInt(segment).toString(2).padStart(8, '0')).join('');
	const cidrNumber = binary.indexOf('0');
	if (cidrNumber === -1) {
		return binary.length;
	}
	if (binary.substring(cidrNumber).indexOf('1') !== -1) {
		throw new Error(`Netmask is not convertable to CIDR format: ${netmask}`);
	}
	return cidrNumber;
}
