'use strict';

var ConfirmationTest = require('./confirmation_test');
var ConfirmCode = require('../../confirm_code');

class IncorrectCodeTest extends ConfirmationTest {

	get description () {
		return 'should return an error when an incorrect confirmation code is used during confirmation';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'USRC-1002'
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard set up for confirmation, but change the confirmation 
		super.before(() => {
			let newConfirmCode;	
			do {	// perhaps being anal here, but let's not accidentally create the same confirmation code, or it won't pass!
				newConfirmCode = ConfirmCode();
			} while (newConfirmCode === this.data.confirmationCode);
			this.data.confirmationCode = newConfirmCode;
			callback();
		});
	}
}

module.exports = IncorrectCodeTest;
