'use strict';

var Registration_Test = require('./registration_test');

const DESCRIPTION = 'should return an object exists error when registering an email that already exists';

class User_Exists_Test extends Registration_Test {

	get_description () {
		return DESCRIPTION;
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
			this.data.emails = data.user.emails;
			callback();
		});
	}
}

module.exports = User_Exists_Test;
