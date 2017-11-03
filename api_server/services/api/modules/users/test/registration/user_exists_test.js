'use strict';

var Registration_Test = require('./registration_test');

class User_Exists_Test extends Registration_Test {

	get description () {
		return 'should return the user when registering an email that already exists as an unconfirmed user';
	}

	before (callback) {
		this.user_factory.create_random_user(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = this.user_factory.get_random_user_data();
				this.data.email = data.user.email;
				callback();
			},
			{
				no_confirm: true
			}
		);
	}
}

module.exports = User_Exists_Test;
