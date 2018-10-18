'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetAllStreamsByTeamTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.whichIsTeamStream = 2;
		this.whichIsPublic = 4;
	}

	get description () {
		return 'should return the correct streams when requesting all streams by team ID';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll fetch all the streams from the team (without repo, it's all the channel and direct streams),
		// but note that only the streams we are a member of will be fetched
		const teamId = this.team._id;
		const teamStreams = this.streamsByTeam[teamId];
		const userId = this.currentUser.user._id;
		this.expectedStreams = teamStreams.filter(
			stream => stream.isTeamStream || stream.privacy === 'public' || stream.memberIds.includes(userId)
		);
		this.expectedStreams.push(this.teamStream);
		this.path = '/streams?teamId=' + teamId;
		callback();
	}
}

module.exports =  GetAllStreamsByTeamTest;
