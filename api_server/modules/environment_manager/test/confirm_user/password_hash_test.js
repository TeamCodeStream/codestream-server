'use strict';

const ConfirmUserTest = require('./confirm_user_test');
const Assert = require('assert');
const RandomString = require('randomstring');
const PasswordHasher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/password_hasher');

class PasswordHashTest extends ConfirmUserTest {

	get description () {
		return 'should be able to set the password hash directly when submitting a request to confirm a user, checked by using the original password to login';
	}

	// before the test runs...
	before (callback) {
		// delete the email from the request body
		super.before(error => {
			if (error) { return callback(error); }
			this.password = RandomString.generate(12);
			(async function(data, password) {
				data.passwordHash = await new PasswordHasher({ password }).hashPassword();
				callback();
			})(this.data, this.password);
		});
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'put',
					path: '/no-auth/login',
					data: {
						email: this.data.email,
						password: this.password
					}
				},
				loginError => {
					if (loginError) {
						Assert.fail('error returned by login with generated password');
					}
					callback();
				}
			);
		});
	}
}

module.exports = PasswordHashTest;
