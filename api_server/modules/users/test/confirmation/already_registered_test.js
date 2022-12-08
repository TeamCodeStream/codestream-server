'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const ConfirmationTest = require('./confirmation_test');

class AlreadyRegisteredTest extends ConfirmationTest {

	get description () {
		const oneUserPerOrg = this.oneUserPerOrg ? ', under one-user-per-org paradigm' : ''; // ONE_USER_PER_ORG
		return `should return an error when confirming a registration with an email that has already been confirmed${oneUserPerOrg}`;
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'USRC-1006'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// run the standard setup, creating an unconfirmed user
			this.confirm 	// now confirm it, so when we run the real test, the user is already confirmed
		], callback);
	}

	// confirm the unconfirmed user, so when we run the real test, the user is already confirmed
	confirm (callback) {
		this.doApiRequest({
			method: this.method,
			path: this.path,
			data: this.data
		}, callback);
	}
}

module.exports = AlreadyRegisteredTest;
