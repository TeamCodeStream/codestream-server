// provide base class for most tests testing the "GET /teams/:id" request

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TeamTestConstants = require('../team_test_constants');

class GetTeamTest extends CodeStreamAPITest {

	get description () {
		return 'should return a valid team when requesting a team created by me';
	}

	getExpectedFields () {
		return { team: TeamTestConstants.EXPECTED_TEAM_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath
		], callback);
	}

	// set the path to use when making the test request
	setPath (callback) {
		// fetch the team i created
		this.path = '/teams/' + this.team._id;
		callback();
	}


	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the expected team (the team we created)
		this.validateMatchingObject(this.team._id, data.team, 'team');
		// ensure the team we got back has no attributes the client shouldn't see, derived classes will do further validation
		this.validateSanitized(data.team, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetTeamTest;
