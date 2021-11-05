'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetFileStreamsByRepoTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting file streams by repo ID';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll fetch all the file streams from the repo
		const teamId = this.team.id;
		const repoId = this.repo.id;
		const codemarkPosts = this.postData.filter(postData => postData.post.codemarkId);
		this.expectedStreams = codemarkPosts.map(postData => postData.streams[0]);
		this.expectedStreams = this.expectedStreams.filter(stream => stream.repoId === repoId);
		this.expectedStreams.push(this.repoStreams[0]);
		this.path = `/streams?type=file&repoId=${repoId}&teamId=${teamId}`;
		callback();
	}
}

module.exports = GetFileStreamsByRepoTest;
