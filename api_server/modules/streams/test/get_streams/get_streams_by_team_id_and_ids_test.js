'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetStreamsByTeamIdAndIdsTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams by team ID and IDs';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// pick a few streams owned by the team and fetch those by ID
		const teamId = this.team.id;
		const codeErrorPosts = this.postData.filter(postData => postData.post.codeErrorId);
		const objectStreams = codeErrorPosts.map(postData => postData.streams[0]);
		this.expectedStreams = [
			objectStreams[3],
			this.teamStream,
			objectStreams[1]
		];
		const ids = this.expectedStreams.map(stream => stream.id);
		this.path = `/streams?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsByTeamIdAndIdsTest;
