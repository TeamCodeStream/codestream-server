'use strict';

var Registration_Test = require('./registration_test');

class User_Exists_Test extends Registration_Test {

	get description () {
		return 'should return an object exists error when registering an email that already exists';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1004'
		};
	}

	before (callback) {
		this.user_factory.create_random_user((error, data) => {
			if (error) { return callback(error); }
			this.data = this.user_factory.get_random_user_data();
			this.data.email = data.user.email;
			callback();
		});
	}
}

module.exports = User_Exists_Test;
