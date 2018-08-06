'use strict';

const CheckSignupTest = require('./check_signup_test');

class NoLoginUnregisteredTest extends CheckSignupTest {

	constructor (options) {
		super(options);
		this.dontConfirm = true;	// don't confirm registration
		this.dontCreateRepo = true; // suppress creating the repo and team for the test
	}

	get description () {
		return 'should return an error when sending a check signup request for a user that has not yet confirmed registration';
	}

	getExpectedError () {
		return {
			code: 'USRC-1010'
		};
	}
}

module.exports = NoLoginUnregisteredTest;
