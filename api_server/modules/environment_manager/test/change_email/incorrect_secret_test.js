'use strict';

const ChangeEmailTest = require('./change_email_test');

class IncorrectSecretTest extends ChangeEmailTest {

	get description () {
		return 'should return an error when making a request to change a user\'s email across environments but providing the incorrect auth secret';
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
