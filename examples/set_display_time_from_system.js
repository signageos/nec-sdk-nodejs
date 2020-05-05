var NECPD = require('@signageos/nec-pd-sdk').default;

var necpd = new NECPD('/dev/ttyS0');

necpd.setDisplayTimeFromSystem()
	 .then(function () {
		 console.log('display time set to match system time');
	 })
	 .catch(function (error) {
		 console.error('set display time failed', error);
	 });
