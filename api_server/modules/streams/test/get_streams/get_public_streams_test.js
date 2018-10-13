'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetPublicStreamsTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.whichIsPublic = 4;
	}

	get description () {
		return 'should return the correct streams when requesting channel streams by team ID, and some of the streams are public streams the user is not a member of';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll fetch all the channel streams from the team,
		// but note that only the streams we are a member of will be fetched
		const teamId = this.team._id;
		const teamStreams = this.streamsByTeam[teamId];
		const userId = this.currentUser.user._id;
		this.expectedStreams = teamStreams.filter(
			stream => stream.type === 'channel' && (stream.memberIds.includes(userId) || stream.privacy === 'public')
		);
		this.expectedStreams.push(this.teamStream);
		this.path = '/streams?type=channel&teamId=' + teamId;
		callback();
	}
}

module.exports = GetPublicStreamsTest;
