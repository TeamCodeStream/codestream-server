'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetStreamsOnlyFromTeamTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams by ID from a given team';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll try to fetch a few streams from our team, and one from the "foreign" team, which we
		// don't belong to ... we should get back only the streams from our team
		let teamId = this.myTeam._id;
		let foreignTeamId = this.foreignTeam._id;
		this.myStreams = [
			this.streamsByTeam[teamId][1],
			this.streamsByTeam[teamId][4]
		];
		let otherStreams = [
			this.streamsByTeam[teamId][0],
			this.streamsByTeam[foreignTeamId][2]
		];
		let allStreams = [...this.myStreams, ...otherStreams];
		let ids = allStreams.map(stream => stream._id);
		this.path = `/streams?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsOnlyFromTeamTest;
