'use strict';

const ConfirmationTest = require('./confirmation_test');

class UnknownUserTest extends ConfirmationTest {

	get description () {
		const oneUserPerOrg = this.oneUserPerOrg ? ', under one-user-per-org paradigm' : ''; // ONE_USER_PER_ORG
		return `should return an error when confirming with an email that does not match an existing unregistered user,${oneUserPerOrg}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'user'
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard setup for a confirmation, but put in a random uid
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = this.userFactory.randomEmail();
			callback();
		});
	}
}

module.exports = UnknownUserTest;
