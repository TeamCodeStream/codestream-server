'use strict';

const ProviderTokenTest = require('./provider_token_test');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class UserNotFoundTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return 'should return an error when completing a third-party provider authorization flow and the user indicated in the state token does not exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'user'
		};
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
}

module.exports = UserNotFoundTest;
