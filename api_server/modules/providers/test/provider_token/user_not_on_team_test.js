'use strict';

const ProviderTokenTest = require('./provider_token_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');
const Assert = require('assert');

class UserNotOnTeamTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return 'should redirect to an error page when completing a third-party provider authorization flow and the user indicated is not on the team indicated';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 2;
			this.teamOptions.members = [];
			callback();
		});
	}
	
	getQueryParameters () {
		const parameters = super.getQueryParameters();
		const tokenHandler = new TokenHandler(this.apiConfig.secrets.auth);
		const delimited = this.state.split('!');
		const payload = tokenHandler.decode(delimited[1]);
		payload.userId = this.users[1].user.id;
		parameters.state = delimited[0] + '!' + tokenHandler.generate(payload, 'pauth');
		return parameters;
	}

	validateResponse (data) {
		Assert(data.match(`\\/web\\/error\\?state=.+&code=RAPI-1010&provider=${this.provider}`), `redirect url not correct for ${this.provider}`);
	}
}

module.exports = UserNotOnTeamTest;
