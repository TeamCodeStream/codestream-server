'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class NewRelicRefreshTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.serviceGatewayEnabled = true;
	}
	
	get description () {
		return 'should refresh a user\'s access token when requested';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.init
		], callback);
	}

	get method () {
		return 'put';
	}
	
	get path () {
		return '/no-auth/provider-refresh/newrelic';
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.accessToken.startsWith('MNRI-'), 'not a valid mock NR access token');
		Assert(data.refreshToken.startsWith('MNRR-'), 'not a valid mock NR refresh token');
		Assert.strictEqual(data.provider, 'azureb2c-cs', 'provider not correct');
		Assert(typeof data.expiresAt === 'number' && data.expiresAt > Date.now());
		this.refreshResponse = data;
	}
}

module.exports = NewRelicRefreshTest;
