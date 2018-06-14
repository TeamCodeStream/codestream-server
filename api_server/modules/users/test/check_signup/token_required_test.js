'use strict';

const CheckSignupTest = require('./check_signup_test');

class TokenRequiredTest extends CheckSignupTest {

	get description () {
		return 'should return an error when sending a check signup request with no token';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'token'
		};
	}

    // before the test runs...
    before (callback) {
        // delete the token from the input data to the test request
        super.before(error => {
            if (error) { return callback(error); }
            delete this.data.token;
            callback();
        });
    }
}

module.exports = TokenRequiredTest;
