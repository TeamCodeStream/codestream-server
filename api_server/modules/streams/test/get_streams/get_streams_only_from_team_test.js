'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetStreamsOnlyFromTeamTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams by ID from a given team';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll try to fetch a few streams from our team, and one from the "foreign" team, which we
		// don't belong to ... we should get back only the streams from our team
		const teamId = this.team.id;
		const foreignTeamId = this.foreignTeam.id;
		this.expectedStreams = [
			this.streamsByTeam[teamId][1],
			this.streamsByTeam[teamId][5],
			this.streamsByTeam[teamId][7]
		];
		const otherStreams = [
			this.streamsByTeam[teamId][0],
			this.streamsByTeam[foreignTeamId][2]
		];
		const allStreams = [...this.expectedStreams, ...otherStreams];
		const ids = allStreams.map(stream => stream.id);
		this.path = `/streams?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsOnlyFromTeamTest;
