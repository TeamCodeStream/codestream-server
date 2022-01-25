'use strict';

const FetchUserTest = require('./fetch_user_test');

class NoSecretTest extends FetchUserTest {

	get description () {
		return 'should return an error when making a request to fetch a user but not providing the auth secret';
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
