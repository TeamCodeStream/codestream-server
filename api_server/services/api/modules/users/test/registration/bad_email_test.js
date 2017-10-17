'use strict';

var Registration_Test = require('./registration_test');
var Random_String = require('randomstring');

class Bad_Email_Test extends Registration_Test {

	get description () {
		return 'should return an invalid email error when registering with a bad email';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1005',
   			info: [{
				email: 'invalid email'
			}]
		};
	}

	before (callback) {
		this.data = this.user_factory.get_random_user_data();
		this.data.email = Random_String.generate(12);
		callback();
	}
}

module.exports = Bad_Email_Test;
