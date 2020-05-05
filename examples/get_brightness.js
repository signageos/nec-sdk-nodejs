var NECPD = require('@signageos/nec-pd-sdk').default;
var Opcode = require('@signageos/nec-pd-sdk/dist/Opcode').default;

var necpd = new NECPD('/dev/ttyS0');

necpd.getParameter(Opcode.SCREEN_BRIGHTNESS)
	 .then(function (brightness) {
		 console.log('brightness: ' + brightness);
	 })
	 .catch(function (error) {
		 console.error('set brightness failed', error);
	 });
