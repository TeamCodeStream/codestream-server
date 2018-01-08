'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetAllStreamsByTeamTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting all streams by team ID';
	}

	setPath (callback) {
		let teamId = this.myTeam._id;
		let teamStreams = this.streamsByTeam[teamId];
		let userId = this.currentUser._id;
		this.myStreams = teamStreams.filter(
			stream => stream.memberIds.indexOf(userId) !== -1
		);
		this.path = '/streams?teamId=' + teamId;
		callback();
	}
}

module.exports =  GetAllStreamsByTeamTest;
