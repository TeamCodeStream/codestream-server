'use strict';

const NewRelicIDPAuthTest = require('./newrelic_idp_auth_test');
const UUID = require('uuid').v4;

class AnonUserIDTest extends NewRelicIDPAuthTest {

	get description () {
		return `should provide the appropriate redirect, when initiating a New Relic IDP authorization flow, and providing an anonymous user ID, which should appear in the redirect`;
	}

	getQueryParameters () {
		const params = super.getQueryParameters();
		this.anonUserId = params.anonUserId = UUID();
		return params;
	}

	getNewRelicIDPRedirectData () {
		const { url, parameters } = super.getNewRelicIDPRedirectData();
		parameters.scheme += `.AUID~${this.anonUserId}`;
		return { url, parameters };
	}
}

module.exports = AnonUserIDTest;
