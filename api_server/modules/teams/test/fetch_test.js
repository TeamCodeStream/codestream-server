'use strict';

const DeleteProviderHostTest = require('./delete_provider_host_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const TeamTestConstants = require('../team_test_constants');

class FetchTest extends DeleteProviderHostTest {

	get description () {
		return 'should properly update the team with the removed provider host when a provider host is deleted, checked by fetching the team';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { team: TeamTestConstants.EXPECTED_TEAM_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// do the usual test prep
			this.deleteProviderHost,	// perform the actual deletion of the provider host
			this.setPath			// set the path of the test, which is to fetch the team
		], callback);
	}

	setPath (callback) {
		this.path = `/teams/${this.team.id}`;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify what we fetch is what we got back in the response
		const expectedTeam = Object.assign({}, this.team);
		expectedTeam.modifiedAt = this.setProviderHostResponse.team.$set.modifiedAt;
		expectedTeam.version = this.setProviderHostResponse.team.$set.version;
		const starredHost = this.host.replace(/\./g, '*');
		expectedTeam.providerHosts[starredHost] = this.providerHostData;
		data.team.memberIds.sort();
		expectedTeam.memberIds.sort();
		Assert.deepEqual(data.team, expectedTeam, 'fetched team does not match');
	}
}

module.exports = FetchTest;
