'use strict';

const GetTeamTest = require('./get_team_test');
const Assert = require('assert');
const GetStandardProviderHosts = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/provider_test_constants');

class StandardProviderHostsTest extends GetTeamTest {

	get description () {
		return 'should return the standard third-party providers as hosts when requesting a team';
	}

	validateResponse (data) {
		const providerHosts = GetStandardProviderHosts(this.apiConfig);
		Assert.deepEqual(data.team.providerHosts, providerHosts, 'returned providerHosts is not correct');
		super.validateResponse(data);
	}
}

module.exports = StandardProviderHostsTest;
