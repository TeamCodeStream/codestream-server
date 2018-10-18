'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetStreamsByRepoIdAndIdsTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams by repo ID and IDs';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// pick a few file streams in the repo to fetch by ID 
		const teamId = this.team._id;
		const repoId = this.repo._id;
		this.expectedStreams = [
			this.streamsByRepo[repoId][0],
			this.streamsByRepo[repoId][2]
		];
		const ids = this.expectedStreams.map(stream => stream._id);
		this.path = `/streams?teamId=${teamId}&repoId=${repoId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsByRepoIdAndIdsTest;
