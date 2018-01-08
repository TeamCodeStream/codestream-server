'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetChannelStreamsByTeamTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting channel streams by team ID';
	}

	setPath (callback) {
		let teamId = this.myTeam._id;
		let teamStreams = this.streamsByTeam[teamId];
		let userId = this.currentUser._id;
		this.myStreams = teamStreams.filter(
			stream => stream.type === 'channel' && stream.memberIds.indexOf(userId) !== -1
		);
		this.path = '/streams?type=channel&teamId=' + teamId;
		callback();
	}
}

module.exports = GetChannelStreamsByTeamTest;
