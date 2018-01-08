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

	before (callback) {
		super.before(() => {
			let newConfirmCode;
			do {
				newConfirmCode = ConfirmCode();
			} while (newConfirmCode === this.data.confirmationCode);
			this.data.confirmationCode = newConfirmCode;
			callback();
		});
	}
}

module.exports = IncorrectCodeTest;
