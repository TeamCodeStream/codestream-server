'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetStreamsOnlyFromTeamTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams by ID from a given team';
	}

	setPath (callback) {
		let teamId = this.myTeam._id;
		let foreignTeamId = this.foreignTeam._id;
		this.myStreams = [
			this.streamsByTeam[teamId][1],
			this.streamsByTeam[teamId][3]
		];
		let otherStreams = [
			this.streamsByTeam[teamId][0],
			this.streamsByTeam[foreignTeamId][1]
		];
		let allStreams = [...this.myStreams, ...otherStreams];
		let ids = allStreams.map(stream => stream._id);
		this.path = `/streams?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsOnlyFromTeamTest;
