'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetDirectStreamsByTeamTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting direct streams by team ID';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll fetch all the direct streams from the team,
		// but note that only the streams we are a member of will be fetched
		const teamId = this.team.id;
		const teamStreams = this.streamsByTeam[teamId];
		const userId = this.currentUser.user.id;
		this.expectedStreams = teamStreams.filter(
			stream => stream.type === 'direct' && stream.memberIds.includes(userId)
		);
		this.path = '/streams?type=direct&teamId=' + teamId;
		callback();
	}
}

module.exports = GetDirectStreamsByTeamTest;
