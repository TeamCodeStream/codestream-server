'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetStreamsByTeamIdAndIdsTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams by team ID and IDs';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// pick a few streams owned by the team (channel or direct) and fetch those by ID
		let teamId = this.myTeam._id;
		this.myStreams = [
			this.streamsByTeam[teamId][1],
			this.streamsByTeam[teamId][4]
		];
		let ids = this.myStreams.map(stream => stream._id);
		this.path = `/streams?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsByTeamIdAndIdsTest;
