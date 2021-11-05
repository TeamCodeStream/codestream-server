'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetAllStreamsByRepoTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting all streams by repo ID';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		const teamId = this.team.id;
		const repoId = this.repo.id;
		const codemarkPosts = this.postData.filter(postData => postData.post.codemarkId);
		this.expectedStreams = codemarkPosts.map(postData => postData.streams[0]);
		this.expectedStreams = this.expectedStreams.filter(stream => stream.repoId === repoId);
		this.expectedStreams.push(this.repoStreams[0]);
		this.path = `/streams?teamId=${teamId}&repoId=${repoId}`;	// get all the streams for this repo
		callback();
	}
}

module.exports = GetAllStreamsByRepoTest;
