'use strict';

var Registration_Test = require('./registration_test');
var Random_String = require('randomstring');

const DESCRIPTION = 'should return an invalid email error when registering with a bad email';

class Registration_Bad_Email_Test extends Registration_Test {

	get_description () {
		return DESCRIPTION;
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
		this.data.emails[0] = Random_String.generate(12);
		callback();
	}
}

module.exports = Registration_Bad_Email_Test;
