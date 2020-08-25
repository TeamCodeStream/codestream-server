'use strict';

const ProviderTokenTest = require('./provider_token_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');
const Assert = require('assert');

class WrongTokenTypeTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return 'should redirect to an error page when completing a third-party provider authorization flow and the type of the state token is not correct';
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		const tokenHandler = new TokenHandler(this.apiConfig.sharedSecrets.auth);
		const delimited = this.state.split('!');
		const payload = tokenHandler.decode(delimited[1]);
		parameters.state = delimited[0] + '!' + tokenHandler.generate(payload, 'xyz');
		return parameters;
	}

	validateResponse (data) {
		Assert(data.match(`\\/web\\/error\\?state=.+&code=AUTH-1002&provider=${this.provider}`), `redirect url not correct for ${this.provider}`);
	}
}

module.exports = WrongTokenTypeTest;
