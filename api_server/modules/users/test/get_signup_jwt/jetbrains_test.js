'use strict';

const GetSignupJWTTest = require('./get_signup_jwt_test');

class JetBrainsTest extends GetSignupJWTTest {

	get description () {
		return 'should return valid paylaod when sending a validate email request for a user who has lastOrigin set to JetBrains';
	}

	// before the test runs...
	before (callback) {
		this.useIDE = 'JetBrains';
		super.before(error => {
			if (error) { return callback(error); }
			Object.assign(this.expectedResponse.payload, {
				protocolHandling: false,
				ide: 'jetbrains'
			})
			callback();
		});
	}
}

module.exports = JetBrainsTest;
