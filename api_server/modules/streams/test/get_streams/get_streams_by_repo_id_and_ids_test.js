'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetStreamsByRepoIdAndIdsTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams by repo ID and IDs';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// pick a few file streams in the repo to fetch by ID 
		const codemarkPosts = this.postData.filter(postData => postData.post.codemarkId);
		let fileStreams = codemarkPosts.map(postData => postData.streams[0]);
		fileStreams = fileStreams.filter(stream => stream.repoId === this.repo.id);
		const teamId = this.team.id;
		const repoId = this.repo.id;
		this.expectedStreams = [
			fileStreams[2],
			this.repoStreams[0],
			fileStreams[1]
		];
		const ids = this.expectedStreams.map(stream => stream.id);
		this.path = `/streams?teamId=${teamId}&repoId=${repoId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsByRepoIdAndIdsTest;
