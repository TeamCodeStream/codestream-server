'use strict';

module.exports = () => {
	let code = Math.floor(Math.random() * 1000000);
	if (code === 0) {
		code = 1;
	}
	if (code === 100000) {
		code = 999999;
	}
	code = code.toString();
	code = '0'.repeat(6 - code.length) + code;
	return code;
}
