'use strict';

var PostTeamStreamTest = require('./post_team_stream_test');
var Assert = require('assert');

class TeamStreamIgnoresMembersTest extends PostTeamStreamTest {

	get description () {
		return 'should return a valid stream and ignore the memberIds attribute when creating a team stream';
	}

	// validate the response to the test request
	validateResponse (data) {
		// we should still see that privacy is public
		let stream = data.stream;
		Assert(typeof stream.memberIds === 'undefined', 'memberIds is defined');
		super.validateResponse(data);
	}
}

module.exports = TeamStreamIgnoresMembersTest;
