'use strict';

const ProviderTokenTest = require('./provider_token_test');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
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
		const tokenHandler = new TokenHandler(SecretsConfig.auth);
		const delimited = this.state.split('!');
		const payload = tokenHandler.decode(delimited[1]);
		parameters.state = delimited[0] + '!' + tokenHandler.generate(payload, 'xyz');
		return parameters;
	}

	validateResponse (data) {
		Assert.equal(data, '/web/error?code=AUTH-1002', `redirect url not correct for ${this.provider}`);
	}
}

module.exports = WrongTokenTypeTest;
