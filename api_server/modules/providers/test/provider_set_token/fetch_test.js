'use strict';

const ProviderSetTokenTest = require('./provider_set_token_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends ProviderSetTokenTest {

	get description () {
		return 'should properly update the user with the provider token when a provider token is added, checked by fetching the user';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// do the usual test prep
			this.setProviderToken,	// perform the actual update
			this.setPath			// set the path of the test, which is to fetch the user
		], callback);
	}

	setPath (callback) {
		this.path = '/users/me';
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify what we fetch is what we got back in the response
		this.expectedUser.modifiedAt = this.setProviderTokenResponse.user.$set.modifiedAt;
		this.expectedUser.version = this.setProviderTokenResponse.user.$set.version;
		this.expectedUser.companyIds = [this.company.id];
		this.expectedUser.teamIds = [this.team.id];
		this.expectedUser.joinMethod = 'Created Team';
		this.expectedUser.originTeamId = this.team.id;
		this.expectedUser.primaryReferral = 'external';
		Assert.deepEqual(data.user, this.expectedUser, 'fetched user does not match');
	}
}

module.exports = FetchTest;
