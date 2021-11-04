'use strict';

const NoTeamsTest = require('./no_teams_test');
const Assert = require('assert');

class AccountIsConnectedTest extends NoTeamsTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.teamOptions.creatorIndex = 0;
	}

	get description () {
		return 'user should get a flag indicating their NR account is connected to a company with response to check signup, when a match to the given account ID is found';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.addNRInfo(callback);
		});
	}

	// add info to the company indicating it is connected to a New Relic accont
	addNRInfo (callback) {
		const accountId = this.codeErrorFactory.randomAccountId();
		this.data.nrAccountId = accountId;
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies/add-nr-info/' + this.company.id,
				data: {
					accountIds: [accountId]
				},
				token: this.users[0].accessToken
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.strictEqual(data.accountIsConnected, true, 'accountIsConnected should be true');
		super.validateResponse(data);
	}
}

module.exports = AccountIsConnectedTest;
