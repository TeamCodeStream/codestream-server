'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class PostProviderTokenTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return `should set an access token for the user when setting a client-fetched access token for ${this.provider}`;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.init
		], callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that the token stored for the user matches the mock token we created
		const providerInfo = data.user.providerInfo[this.provider];
		Assert.equal(providerInfo.accessToken, this.mockToken, 'user access token not found to be equal to the sent token');

		// verify that the correct provider info made its way into the user object created
		const expectedProviderIdentities = [`${this.provider}::${this.providerUserId}`];
		Assert.deepEqual(data.user.providerIdentities, expectedProviderIdentities, 'providerIdentities not connect');
		Assert.equal(providerInfo.userId, this.providerUserId, 'provider userId does not match expected userId');
	}
}

module.exports = PostProviderTokenTest;
