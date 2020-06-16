'use strict';

const ProviderRefreshTest = require('./provider_refresh_test');

class InvalidTokenTest extends ProviderRefreshTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return `should return an error when attempting to refresh the token for ${this.provider} and the refresh token is invalid`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	getQueryParameters () {
		this.refreshedMockToken = 'error';
		return super.getQueryParameters();
	}
}

module.exports = InvalidTokenTest;
