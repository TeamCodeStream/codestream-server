'use strict';

const ProviderTokenTest = require('./provider_token_test');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class UserNotOnTeamTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return 'should return an error when completing a third-party provider authorization flow and the user indicated is not on the team indicated';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 2;
			this.teamOptions.members = [];
			callback();
		});
	}
	
	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		const tokenHandler = new TokenHandler(SecretsConfig.auth);
		const delimited = this.state.split('!');
		const payload = tokenHandler.decode(delimited[1]);
		payload.userId = this.users[1].user.id;
		parameters.state = delimited[0] + '!' + tokenHandler.generate(payload, 'pauth');
		return parameters;
	}
}

module.exports = UserNotOnTeamTest;
