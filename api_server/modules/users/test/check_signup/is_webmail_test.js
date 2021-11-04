'use strict';

const CheckSignupTest = require('./check_signup_test');

class IsWebmailTest extends CheckSignupTest {

	constructor (options) {
		super(options);
		this.wantWebmail = true;
	}

	get description () {
		return 'response to check signup should include flag indicating email is a webmail address';
	}
}

module.exports = IsWebmailTest;
