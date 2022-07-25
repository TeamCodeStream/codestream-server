// handle unit tests for the "GET /bcast-token" request to fetch a the user's V3 broadcaster token

'use strict';

const GetBCastTokenTest = require('./get_bcast_token_test');
const GetBCastTokenWithTeamTest = require('./get_bcast_token_with_team_test');

class GetBCastTokenRequestTester {

	test () {
		new GetBCastTokenTest().test();
		new GetBCastTokenWithTeamTest().test();
	}
}

module.exports = new GetBCastTokenRequestTester();
