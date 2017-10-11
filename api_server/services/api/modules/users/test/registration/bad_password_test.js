'use strict';

var Registration_Test = require('./registration_test');
var Random_String = require('randomstring');

class Bad_Password_Test extends Registration_Test {

	get description () {
		return 'should return an invalid password error when registering with a bad password';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1005',
   			info: [{
				password: 'must be at least six characters'
			}]
		};
	}

	before (callback) {
		this.data = this.user_factory.get_random_user_data();
		this.data.password = Random_String.generate(5);
		callback();
	}
}

module.exports = Bad_Password_Test;
