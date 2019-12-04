'use strict';

const ProviderTokenTest = require('./provider_token_test');
const TokenHandler = require(process.env.CS_API_TOP + '/server_utils/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const Assert = require('assert');

class UserNotFoundTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return 'should redirect to an error page when completing a third-party provider authorization flow and the user indicated in the state token does not exist';
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		const tokenHandler = new TokenHandler(SecretsConfig.auth);
		const delimited = this.state.split('!');
		const payload = tokenHandler.decode(delimited[1]);
		payload.userId = 'x';
		parameters.state = delimited[0] + '!' + tokenHandler.generate(payload, 'pauth');
		return parameters;
	}

	validateResponse (data) {
		Assert(data.match(`\\/web\\/error\\?state=.+code=RAPI-1003&provider=${this.provider}`), `redirect url not correct for ${this.provider}`);
	}
}

module.exports = UserNotFoundTest;
