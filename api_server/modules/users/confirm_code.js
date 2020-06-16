'use strict';

// provide a function to generate a six-digit confirmation code

module.exports = () => {
	let code = Math.floor(Math.random() * 1000000);
	if (code === 0) {
		code = 1;	// being paranoid, but '000000' would look kind of sucky
	}
	if (code === 100000) {	// just in case...
		code = 999999;
	}
	code = code.toString();
	code = '0'.repeat(6 - code.length) + code;	 // pad-left with '0'
	return code;
};
