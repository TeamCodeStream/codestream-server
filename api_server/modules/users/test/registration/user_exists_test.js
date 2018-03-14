'use strict';

var RegistrationTest = require('./registration_test');
//const ApiConfig = require(process.env.CS_API_TOP + '/config/api.js');

class UserExistsTest extends RegistrationTest {

	get description () {
		return 'should return the user when registering an email that already exists as an unconfirmed user';
	}

	// before the test runs...
	before (callback) {
		// create a random user, unconfirmed, and then borrow that user's email for the registration
		this.userFactory.createRandomUser(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = this.userFactory.getRandomUserData();
				this.data.email = data.user.email;
//				this.data.betaCode = ApiConfig.testBetaCode;	// overrides needing a true beta code
				callback();
			},
			{
				noConfirm: true
			}
		);
	}
}

module.exports = UserExistsTest;
