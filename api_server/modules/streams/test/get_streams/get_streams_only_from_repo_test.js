'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetStreamsOnlyFromRepoTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams by ID from a given repo';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll try to fetch a few streams from our repo, and one from the "foreign" repo, which we
		// don't have access to ... we should get back only the streams from our repo
		const teamId = this.team.id;
		const repoId = this.repo.id;
		const codemarkPosts = this.postData.filter(postData => postData.post.codemarkId);
		let fileStreams = codemarkPosts.map(postData => postData.streams[0]);
		fileStreams = fileStreams.filter(stream => stream.repoId === this.repo.id);
		const foreignRepoId = this.foreignTeamResponse.repo.id;
		let foreignCodemarkPosts = this.foreignStreamResponse.postData.filter(postData => postData.post.codemarkId);
		let foreignFileStreams = foreignCodemarkPosts.map(postData => postData.streams[0]);
		foreignFileStreams = foreignFileStreams.filter(stream => stream.repoId === foreignRepoId); 
		this.expectedStreams = [
			fileStreams[2],
			this.repoStreams[0],
			fileStreams[1]
		];
		const otherStreams = [
			foreignFileStreams[2],
			this.foreignTeamResponse.teamStream,
			foreignFileStreams[1]
		];
		const allStreams = [...this.expectedStreams, ...otherStreams];
		const ids = allStreams.map(stream => stream.id);
		this.path = `/streams?teamId=${teamId}&repoId=${repoId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsOnlyFromRepoTest;
