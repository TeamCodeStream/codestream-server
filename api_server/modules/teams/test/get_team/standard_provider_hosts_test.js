'use strict';

const GetTeamTest = require('./get_team_test');
const Assert = require('assert');
const STANDARD_PROVIDER_HOSTS = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/provider_test_constants').STANDARD_PROVIDER_HOSTS;

class StandardProviderHostsTest extends GetTeamTest {

	get description () {
		return 'should return the standard third-party providers as hosts when requesting a team';
	}

	validateResponse (data) {
		Assert.deepEqual(data.team.providerHosts, STANDARD_PROVIDER_HOSTS, 'returned providerHosts is not correct');
		super.validateResponse(data);
	}
}

module.exports = StandardProviderHostsTest;
