'use strict';

const InitialDataTest = require('./initial_data_test');
const Assert = require('assert');

class AccountIsConnectedTest extends InitialDataTest {

	get description () {
		return 'user should get a flag indicating their NR account is connected to a company with response to email confirmation, when a match to the given account ID is found';
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
				token: this.users[1].accessToken
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
