'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

/* eslint no-console: 0 */

class ProviderTokenTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return `should set an access token for the user when completing an authorization flow for ${this.provider}`;
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that the token stored for the user matches the mock token we created
		const providerInfo = data.user.providerInfo[this.team.id][this.provider];
		const token = providerInfo.accessToken;
		Assert.equal(token, this.mockToken, 'user access token not found to be equal to the mock token');

		let expectedData;
		switch (this.provider) {
		case 'trello':
			return;
		case 'github':
			expectedData = this.getExpectedGithubTestCallData();
			break;
		case 'asana':
			expectedData = this.getExpectedAsanaTestCallData();
			break;
		case 'jira':
			expectedData = this.getExpectedJiraTestCallData();
			break;
		default:
			throw `unknown provider ${this.provider}`;
		}

		const { url, parameters } = providerInfo._testCall;
		const expectedUrl = expectedData.url;
		const expectedParameters = expectedData.parameters;
		Assert.equal(url, expectedUrl, 'url passed for token exchange is not correct');
		console.warn('PARAMETERS:', JSON.stringify(parameters, undefined, 5));
		console.warn('EXPECTED:', JSON.stringify(expectedParameters, undefined, 5));
		Assert.deepEqual(parameters, expectedParameters, 'parameters passed for token exchange are not correct');
	}
}

module.exports = ProviderTokenTest;
