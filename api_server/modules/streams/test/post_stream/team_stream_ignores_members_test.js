'use strict';

const PostTeamStreamTest = require('./post_team_stream_test');
const Assert = require('assert');

class TeamStreamIgnoresMembersTest extends PostTeamStreamTest {

	get description () {
		return 'should return a valid stream and ignore the memberIds attribute when creating a team stream';
	}

	// validate the response to the test request
	validateResponse (data) {
		// memberIds is added to channel streams, but this should be ignored for team streams
		const stream = data.stream;
		Assert(typeof stream.memberIds === 'undefined', 'memberIds is defined');
		super.validateResponse(data);
	}
}

module.exports = TeamStreamIgnoresMembersTest;
