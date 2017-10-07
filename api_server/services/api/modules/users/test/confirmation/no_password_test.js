'use strict';

var Confirmation_Test = require('./confirmation_test');

class No_Password_Test extends Confirmation_Test {

	get_description () {
		return 'should return an error when no password passed in confirmation and user has no password yet';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1001',
			info: 'password'
		};
	}

	before (callback) {
		this.user_options = {
			no_password: true
		};
		super.before(callback);
	}
}

module.exports = No_Password_Test;
