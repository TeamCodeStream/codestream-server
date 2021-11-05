'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetStreamsOnlyFromTeamTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams by ID from a given team';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll try to fetch a few streams from our team, and one from the "foreign" team, which we
		// don't belong to ... we should get back only the streams from our team
		const teamId = this.team.id;
		const codeErrorPosts = this.postData.filter(postData => postData.post.codeErrorId);
		const objectStreams = codeErrorPosts.map(postData => postData.streams[0]);
		const foreignCodeErrorPosts = this.foreignStreamResponse.postData.filter(postData => postData.post.codeErrorId);
		const foreignObjectStreams = foreignCodeErrorPosts.map(postData => postData.streams[0]);
		this.expectedStreams = [
			objectStreams[3],
			this.teamStream,
			objectStreams[1]
		];
		const otherStreams = [
			foreignObjectStreams[3],
			this.foreignTeamResponse.teamStream,
			foreignObjectStreams[0]
		];
		const allStreams = [...this.expectedStreams, ...otherStreams];
		const ids = allStreams.map(stream => stream.id);
		this.path = `/streams?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsOnlyFromTeamTest;
