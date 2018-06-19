// base class for many tests of the "PUT /teams" requests

'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var CommonInit = require('./common_init');
const TeamTestConstants = require('../team_test_constants');

class PutTeamTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the updated team when updating a team';
	}

	get method () {
		return 'put';
	}

	getExpectedFields () {
		return { team: ['name', 'modifiedAt'] };
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back a team with the updated name
		const team = data.team;
		Assert.equal(team._id, this.team._id, 'returned team ID is not the same');
		Assert.equal(team.name, this.data.name, 'name does not match');
		Assert(team.modifiedAt > this.modifiedAfter, 'modifiedAt is not greater than before the team was updated');
		// verify the team in the response has no attributes that should not go to clients
		this.validateSanitized(team, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PutTeamTest;
