'use strict';

const ProviderRefreshTest = require('./provider_refresh_test');

class NoRefreshForProviderTest extends ProviderRefreshTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return `should return an error when attempting to refresh the token for a provider that does not support token refresh (${this.unsupportedProvider})`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009',
			reason: 'token refresh not supported'
		};
	}

	getPath () {
		const parameters = this.getQueryParameters();
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		return `/provider-refresh/${this.unsupportedProvider}?${query}`;
	}
}

module.exports = NoRefreshForProviderTest;
