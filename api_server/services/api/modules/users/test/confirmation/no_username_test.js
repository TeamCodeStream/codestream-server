'use strict';

var Confirmation_Test = require('./confirmation_test');

class No_Username_Test extends Confirmation_Test {

	get_description () {
		return 'should return an error when no username passed in confirmation and user has no username yet';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1001',
			info: 'username'
		};
	}

	before (callback) {
		this.user_options = {
			no_username: true
		};
		super.before(callback);
	}
}

module.exports = No_Username_Test;
