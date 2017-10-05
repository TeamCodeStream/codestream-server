'use strict';

var Authentication_Test = require('./authentication_test');

const DESCRIPTION = 'should prevent access to resources when no access token is supplied';

class Authentication_Missing_Authorization_Test extends Authentication_Test {

	get_description () {
		return DESCRIPTION;
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
