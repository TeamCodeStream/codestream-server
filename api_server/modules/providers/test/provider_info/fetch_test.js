'use strict';

const ProviderInfoTest = require('./provider_info_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends ProviderInfoTest {

	get description () {
		return 'should properly update the user with the provider info when provider info is set, checked by fetching the user';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// do the usual test prep
			this.setProviderInfo,	// perform the actual update
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
		this.expectedUser.modifiedAt = this.setProviderInfoResponse.user.$set.modifiedAt;
		this.expectedUser.version = this.setProviderInfoResponse.user.$set.version;
		this.expectedUser.companyIds = [this.company.id];
		this.expectedUser.teamIds = [this.team.id];
		this.expectedUser.joinMethod = 'Created Team';
		this.expectedUser.originTeamId = this.team.id;
		this.expectedUser.primaryReferral = 'external';
		Assert.deepEqual(data.user, this.expectedUser, 'fetched user does not match');
	}
}

module.exports = FetchTest;
