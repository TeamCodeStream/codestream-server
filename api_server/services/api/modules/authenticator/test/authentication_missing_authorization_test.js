'use strict';

var Authentication_Test = require('./authentication_test');

class Authentication_Missing_Authorization_Test extends Authentication_Test {

	get description () {
		return 'should prevent access to resources when no access token is supplied';
	}

	get_expected_error () {
		return {
			code: 'AUTH-1001'
		};
	}

	before (callback) {
		delete this.token;
		super.before(callback);
	}
}

module.exports = Authentication_Missing_Authorization_Test;
