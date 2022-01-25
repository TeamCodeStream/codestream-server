'use strict';

const FetchUserTest = require('./fetch_user_test');

class IncorrectSecretTest extends FetchUserTest {

	get description () {
		return 'should return an error when making a request to fetch a user but providing the incorrect auth secret';
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
