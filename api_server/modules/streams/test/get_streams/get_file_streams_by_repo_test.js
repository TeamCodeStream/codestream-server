'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetFileStreamsByRepoTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting file streams by repo ID';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll fetch all the file streams from the repo
		const repoId = this.repo.id;
		const teamId = this.team.id;
		this.expectedStreams = [
			...this.streamsByRepo[repoId],
			this.repoStreams[0]
		];
		this.path = `/streams?type=file&repoId=${repoId}&teamId=${teamId}`;
		callback();
	}
}

module.exports = GetFileStreamsByRepoTest;
