var NECPD = require('@signageos/nec-pd-sdk').default;
var Opcode = require('@signageos/nec-pd-sdk/dist/Opcode').default;
var ComputeModuleFanMode = require('@signageos/nec-pd-sdk/dist/constants').ComputeModuleFanMode;

var necpd = new NECPD('/dev/ttyS0');

function wait (timeout) {
	return new Promise(function (resolve) {
		setTimeout(resolve, timeout);
	});
}

necpd.setParameter(Opcode.COMPUTE_MODULE_FAN_POWER_MODE, ComputeModuleFanMode.ON)
	 .then(function () {
		 console.log('compute module fan is on');
		 return wait(5e3);
	 })
	 .then(function () {
		 return necpd.setParameter(Opcode.COMPUTE_MODULE_FAN_POWER_MODE, ComputeModuleFanMode.OFF);
	 })
	 .then(function () {
		 console.log('compute module fan is off');
	 })
	 .catch(function (error) {
		 console.error('set compute module fan power mode failed', error);
	 });
