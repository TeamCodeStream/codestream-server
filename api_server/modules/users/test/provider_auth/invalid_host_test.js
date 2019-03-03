'use strict';

const ProviderAuthTest = require('./provider_auth_test');

class InvalidHostTest extends ProviderAuthTest {

	constructor (options) {
		super(options);
		delete this.apiRequestOptions;
	}

	get description () {
		return `should return an error when initiating authorization flow for ${this.provider}, enterprise provider, but the host is not found`;
	}

	getExpectedError () {
		return {
			code: 'USRC-1017'
		};
	}
}

module.exports = InvalidHostTest;
