'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetTeamStreamsTest extends GetStreamsTest {

    constructor (options) {
		super(options);
		this.whichIsTeamStream = 4;
	}

	get description () {
		return 'should return the correct streams when requesting channel streams by team ID, and some of the streams are team streams';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll fetch all the channel streams from the team,
		// but note that only the streams we are a member of will be fetched
		let teamId = this.myTeam._id;
		let teamStreams = this.streamsByTeam[teamId];
		let userId = this.currentUser._id;
		this.myStreams = teamStreams.filter(
			stream => stream.type === 'channel' && (stream.isTeamStream || stream.memberIds.includes(userId))
		);
		this.myStreams.push(this.myTeamStream);
		this.path = '/streams?type=channel&teamId=' + teamId;
		callback();
	}
}

module.exports = GetTeamStreamsTest;
