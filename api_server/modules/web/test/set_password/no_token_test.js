'use strict';

const ErrorTest = require('./error_test');

class NoTokenTest extends ErrorTest {

	get description () {
		return 'should redirect to an error page when setting a password without providing a reset password token';
	}

	before (callback) {
		delete this.apiRequestOptions;
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.token;
			callback();
		});
	}
}

module.exports = NoTokenTest;
