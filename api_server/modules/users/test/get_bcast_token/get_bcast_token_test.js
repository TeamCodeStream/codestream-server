'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');

class GetBCastTokenTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should return the user\'s V3 broadcaster token when requested';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/bcast-token';
	}

	getExpectedFields () {
		return ['token'];
	}

	// validate the response to the test request
	validateResponse (data) {
		const expectedResponse = {
			token: this.currentUser.broadcasterV3Token
		};
		if (this.apiConfig.broadcastEngine.pubnub && this.apiConfig.broadcastEngine.pubnub.subscribeKey) {
			expectedResponse.pubnubKey = this.apiConfig.broadcastEngine.pubnub.subscribeKey;
		}
		Assert.deepStrictEqual(data, expectedResponse, 'response not correct');
	}
}

module.exports = GetBCastTokenTest;
