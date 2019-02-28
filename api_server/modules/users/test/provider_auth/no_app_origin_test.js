'use strict';

const ProviderAuthTest = require('./provider_auth_test');

class NoAppOriginTest extends ProviderAuthTest {

	constructor (options) {
		super(options);
		delete this.apiRequestOptions;
	}

	get description () {
		return 'should return an error when initiating authorization flow for an enterprise provider without supplying an app origin';
	}

	getExpectedError () {
		return {
			code: 'USRC-1017'
		};
	}

	getAuthCode (callback) {
		super.getAuthCode(() => {
			const match = this.path.match(/^(.+)&(appOrigin=.+)$/);
			this.path = match[1];
			callback();
		});
	}
}

module.exports = NoAppOriginTest;
