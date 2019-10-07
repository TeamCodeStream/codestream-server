'use strict';

const IdentityMatchTest = require('./identity_match_test');
const Assert = require('assert');

class IdentityMatchErrorTest extends IdentityMatchTest {

	run (callback) {
		Assert(this.providerTokenData.match(`\\/web\\/provider-auth-complete\\/${this.provider}\\?error=${this.expectError}`), `expected redirect to error page with ${this.expectError}`);
		Assert.equal(this.signupError.code, 'USRC-1022', 'expected signup error to have code USRC-1022');
		Assert.equal(this.signupError.error, this.expectError, `expected signup error to have ${this.expectError} error`);
		callback();
	}
}

module.exports = IdentityMatchErrorTest;
