'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetStreamsByTeamIdAndIdsTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams by team ID and IDs';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// pick a few streams owned by the team (channel or direct) and fetch those by ID
		const teamId = this.team.id;
		this.expectedStreams = [
			this.streamsByTeam[teamId][1],
			this.streamsByTeam[teamId][5],
			this.streamsByTeam[teamId][7]
		];
		const ids = this.expectedStreams.map(stream => stream.id);
		this.path = `/streams?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsByTeamIdAndIdsTest;
