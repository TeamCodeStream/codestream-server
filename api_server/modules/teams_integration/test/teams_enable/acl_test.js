'use strict';

var TeamsEnableTest = require('./teams_enable_test');

class ACLTest extends TeamsEnableTest {

	get description () {
		return 'should return an error when trying to send a teams enable request without providing the secret';
	}

	getExpectedError () {
		return {
			code: 'INTG-1001',
		};
	}

	// before the test runs...
	before (callback) {
		// call standard setup, but then remove the secret
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.secret;
			callback();
		});
	}
}

module.exports = ACLTest;
