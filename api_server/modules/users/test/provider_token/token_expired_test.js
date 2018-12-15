'use strict';

const ProviderTokenTest = require('./provider_token_test');

class TokenExpiredTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.expiresIn = 1000;
	}

	get description () {
		return 'should return an error when completing a third-party provider authorization flow and the state token is expired';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1005'
		};
	}

	run (callback) {
		setTimeout(() => {
			super.run(callback);
		}, 2000);
	}
}

module.exports = TokenExpiredTest;
