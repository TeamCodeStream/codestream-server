'use strict';

const ChangeEmailTest = require('./change_email_test');

class NoSecretTest extends ChangeEmailTest {

	get description () {
		return 'should return an error when making a request to change a user\'s email across environments but not providing the auth secret';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.apiRequestOptions.headers['X-CS-Auth-Secret'];
			callback();
		});
	}
}

module.exports = NoSecretTest;
