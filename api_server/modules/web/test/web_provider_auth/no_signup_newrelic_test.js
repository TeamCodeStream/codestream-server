'use strict';

const NewRelicIDPAuthTest = require('./newrelic_idp_auth_test');

class NoSignupNewRelicTest extends NewRelicIDPAuthTest {

	constructor (options) {
		super(options);
		this.doNoSignup = true;
	}

	get description () {
		return `should provide the appropriate redirect, when initiating a New Relic IDP authorization flow, and providing a flag to disallow signups, which should appear in the redirect`;
	}

	getNewRelicIDPRedirectData () {
		const { url, parameters } = super.getNewRelicIDPRedirectData();
		parameters.scheme += `.NOSU~1`;
		return { url, parameters };
	}
}

module.exports = NoSignupNewRelicTest;
