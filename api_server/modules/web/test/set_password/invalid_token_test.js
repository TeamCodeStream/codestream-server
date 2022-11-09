'use strict';

const ErrorTest = require('./error_test');

class InvalidTokenTest extends ErrorTest {

	get description () {
		return 'should redirect to an error page when setting a password with an invalid token';
	}

	before (callback) {
		delete this.apiRequestOptions;
		super.before(error => {
			if (error) { return callback(error); }
			this.data.token = 'abcxyz';
			callback();
		});
	}
}

module.exports = InvalidTokenTest;
