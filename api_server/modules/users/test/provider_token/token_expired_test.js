'use strict';

const ProviderTokenTest = require('./provider_token_test');
const Assert = require('assert');

class TokenExpiredTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.expiresIn = 1000;
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return 'should redirect to an error page when completing a third-party provider authorization flow and the state token is expired';
	}

	run (callback) {
		setTimeout(() => {
			super.run(callback);
		}, 2000);
	}

	validateResponse (data) {
		Assert.equal(data, '/web/error?code=AUTH-1005', `redirect url not correct for ${this.provider}`);
	}
}

module.exports = TokenExpiredTest;
