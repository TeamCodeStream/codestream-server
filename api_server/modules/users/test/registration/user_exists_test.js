'use strict';

var RegistrationTest = require('./registration_test');

class UserExistsTest extends RegistrationTest {

	get description () {
		return 'should return the user when registering an email that already exists as an unconfirmed user';
	}

	before (callback) {
		this.userFactory.createRandomUser(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = this.userFactory.getRandomUserData();
				this.data.email = data.user.email;
				callback();
			},
			{
				noConfirm: true
			}
		);
	}
}

module.exports = UserExistsTest;
