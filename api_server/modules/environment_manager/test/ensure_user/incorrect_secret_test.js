'use strict';

const EnsureExistingUserTest = require('./ensure_existing_user_test');

class IncorrectSecretTest extends EnsureExistingUserTest {

	get description () {
		return 'should return an error when making a cross-environment request to fetch a user but providing the incorrect auth secret';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions.headers['X-CS-Auth-Secret'] = 'xxxxxxxxxxx';
			callback();
		});
	}
}

module.exports = IncorrectSecretTest;
