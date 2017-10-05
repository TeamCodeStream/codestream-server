'use strict';

var Confirmation_Test = require('./confirmation_test');
var Confirm_Code = require('../../confirm_code');

class Confirmation_Incorrect_Code_Test extends Confirmation_Test {

	get_description () {
		return 'should return an error when an incorrect confirmation code is used during confirmation';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'USRC-1002'
		};
	}

	before (callback) {
		super.before(() => {
			let new_confirm_code;
			do {
				new_confirm_code = Confirm_Code();
			} while (new_confirm_code === this.data.confirmation_code);
			this.data.confirmation_code = new_confirm_code;
			callback();
		});
	}
}

module.exports = Confirmation_Incorrect_Code_Test;
