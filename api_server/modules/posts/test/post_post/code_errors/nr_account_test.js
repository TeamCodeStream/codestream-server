'use strict';

const CodeErrorTest = require('./code_error_test');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class NRAccountTest extends CodeErrorTest {

	get description () {
		return 'should allow a user who has access to a NewRelic account (faked) to create a code error and claim it for their team';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setMockAccountIds,
			this.setUserToken
		], callback)
	}

	// set the mock account IDs to use for the test
	setMockAccountIds (callback) {
		if (this.dontIncludeErrorGroupId) {
			this.apiRequestOptions.headers['X-CS-Mock-Error-Group-Id'] = "";	
		} else {
			this.apiRequestOptions.headers['X-CS-Mock-Error-Group-Id'] = this.data.codeError.objectId;
		}
		/*
		const codeErrorId = this.data.codeError.accountId;
		const accountIds = [];
		while (
			accountIds.length === 0 || 
			accountIds.includes(codeErrorId)
		) {
			for (let i = 0; i < 3; i++) {
				accountIds[i] = this.codeErrorFactory.randomAccountId();
			}
		}
		if (!this.dontIncludeCodeErrorAccountId) {
			accountIds.splice(1, 0, this.data.codeError.accountId);
		}
		this.apiRequestOptions.headers['X-CS-Mock-Account-Ids'] = `${accountIds.join(",")}`;
		*/
		callback();
	}

	// set a (fake) New Relic access token for the user
	setUserToken (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/provider-set-token/newrelic',
				data: {
					token: RandomString.generate(20),
					teamId: this.team.id
				},
				token: this.token
			},
			callback
		);
	}
}

module.exports = NRAccountTest;
