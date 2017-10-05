'use strict';

var Login_Test = require('./login_test');

const DESCRIPTION = 'should return error when invalid email provided';

class Login_Invalid_Email_Test extends Login_Test {

	get_description () {
		return DESCRIPTION;
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1003',
			info: 'email'
		};
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			this.data.email = this.user_factory.random_email();
			callback();
		});
	}
}

module.exports = Login_Invalid_Email_Test;
