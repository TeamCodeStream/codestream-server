'use strict';

const GetTeamTest = require('./get_team_test');
const Assert = require('assert');
const STANDARD_PROVIDER_HOSTS = require(process.env.CS_API_TOP + '/modules/providers/provider_test_constants').STANDARD_PROVIDER_HOSTS;

class StandardProviderHostsTest extends GetTeamTest {

	get description () {
		return 'should return the standard third-party providers as hosts when requesting a team';
	}

	validateResponse (data) {
		console.warn('ACTUAL PROVIDER HOSTS:', JSON.stringify(data.team.providerHosts, 0, 5));
		console.warn('EXPECTED PROVIDER HOSTS:', JSON.stringify(STANDARD_PROVIDER_HOSTS, 0, 5));
		Assert.deepEqual(data.team.providerHosts, STANDARD_PROVIDER_HOSTS, 'returned providerHosts is not correct');
		super.validateResponse(data);
	}
}

module.exports = StandardProviderHostsTest;
