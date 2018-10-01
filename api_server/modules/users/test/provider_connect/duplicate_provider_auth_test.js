'use strict';

const ProviderConnectTest = require('./provider_connect_test');
const RandomString = require('randomstring');

class DuplicateProviderAuthTest extends ProviderConnectTest {

	constructor (options) {
		super(options);
		this.wantPreExistingTeam = true;
		this.wantPreExistingConnectedUser = true;
	}

	get description () {
		return `should return an error when a user connects to ${this.provider} but they are already connected with a different team`;
	}

	getExpectedError () {
		return {
			code: 'USRC-1015'
		};
	}

	setData (callback) {
		super.setData(() => {
			// change the auth token to mock them being on a different team
			const mockUserId = this.preExistingConnectedUser.providerInfo[this.provider].userId;
			const mockTeamId = `MOCK${RandomString.generate(8)}`;
			const code = `mock-${mockUserId}-${mockTeamId}`;
			this.data.providerInfo.code = code;
			callback();
		});

	}
}

module.exports = DuplicateProviderAuthTest;
