'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetAllStreamsByTeamTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting all streams by team ID';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll fetch all the streams from the team (without repo, it's all the channel and direct streams),
		// but note that only the streams we are a member of will be fetched
		let teamId = this.myTeam._id;
		let teamStreams = this.streamsByTeam[teamId];
		let userId = this.currentUser._id;
		this.myStreams = teamStreams.filter(
			stream => stream.memberIds.includes(userId)
		);
		this.myStreams.push(this.myTeamStream);
		this.path = '/streams?teamId=' + teamId;
		callback();
	}
}

module.exports =  GetAllStreamsByTeamTest;
