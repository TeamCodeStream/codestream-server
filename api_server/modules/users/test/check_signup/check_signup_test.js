'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const STANDARD_PROVIDER_HOSTS = require(process.env.CS_API_TOP + '/modules/providers/provider_test_constants').STANDARD_PROVIDER_HOSTS;

class CheckSignupTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
		this.expectedOrigin = 'VS Code';
		this.apiRequestOptions = {
			headers: {
				'X-CS-Plugin-IDE': this.expectedOrigin
			}
		};
	}

	get description () {
		return 'should return login data and an access token when a user has been issued a signup token and signed up with it';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/check-signup';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_LOGIN_RESPONSE;
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
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user.email === this.currentUser.user.email, 'email doesn\'t match');
		Assert(data.user.lastLogin >= this.beforeLogin, 'lastLogin not set to most recent login time');
		Assert(data.user.firstSessionStartedAt >= this.beforeLogin, 'firstSessionStartedAt not set to most recent login time');		
		Assert.equal(data.user.lastOrigin, this.expectedOrigin, 'lastOrigin not set to plugin IDE');
		Assert(data.accessToken, 'no access token');
		Assert(data.pubnubKey, 'no pubnub key');
		Assert(data.pubnubToken, 'no pubnub token');
		Assert(data.broadcasterToken, 'no broadcaster token');
		Assert.deepEqual(data.capabilities, UserTestConstants.API_CAPABILITIES, 'capabilities are incorrect');
		Assert(data.teams.length === 1, 'no team in response');
		Assert.deepEqual(data.teams[0].providerHosts, STANDARD_PROVIDER_HOSTS, 'returned provider hosts is not correct\n\nGOT:\n' + JSON.stringify(data.teams[0].providerHosts, undefined, 5) + '\n\nEXPECTED:\n' + JSON.stringify(STANDARD_PROVIDER_HOSTS, undefined, 5));
		this.validateMatchingObject(this.team.id, data.teams[0], 'team');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = CheckSignupTest;
