'use strict';

const ProviderRefreshTest = require('./provider_refresh_test');

class UnknownProviderTest extends ProviderRefreshTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return 'should return an error when attempting to refresh the token for an unknown provider';
	}

	getExpectedError () {
		return {
			code: 'USRC-1013'
		};
	}

	getPath () {
		const parameters = this.getQueryParameters();
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		return `/provider-refresh/blahblah?${query}`;
	}
}

module.exports = UnknownProviderTest;
