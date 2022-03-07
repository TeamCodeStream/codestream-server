'use strict';

const DeleteUserTest = require('./delete_user_test');

class IncorrectSecretTest extends DeleteUserTest {

	get description () {
		return 'should return an error when making a request to delete a user across environments but providing the incorrect auth secret';
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
