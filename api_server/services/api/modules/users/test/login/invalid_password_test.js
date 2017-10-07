'use strict';

var Login_Test = require('./login_test');

const DESCRIPTION = 'should return error when invalid password provided';

class Invalid_Password_Test extends Login_Test {

	get_description () {
		return DESCRIPTION;
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'USRC-1001'
		};
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			this.data.password += 'x';
			callback();
		});
	}
}

module.exports = Invalid_Password_Test;
