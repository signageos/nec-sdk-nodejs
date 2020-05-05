var NECPD = require('@signageos/nec-pd-sdk').default;
var Opcode = require('@signageos/nec-pd-sdk/dist/Opcode').default;

var necpd = new NECPD('/dev/ttyS0');

necpd.setParameter(Opcode.SCREEN_BRIGHTNESS, 80)
	 .then(function () {
		 console.log('brightness set to 80');
	 })
	 .catch(function (error) {
		 console.error('set brightness failed', error);
	 });
