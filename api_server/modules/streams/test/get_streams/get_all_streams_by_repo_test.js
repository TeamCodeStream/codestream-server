'use strict';

const GetStreamsTest = require('./get_streams_test');

class GetAllStreamsByRepoTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting all streams by repo ID';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		const repoId = this.repo.id;
		const teamId = this.team.id;
		this.expectedStreams = this.streamsByRepo[repoId];	// these are the streams we expect to see in the response
		this.expectedStreams.push(this.repoStreams[0]);	// stream created as a side-effect of creating the repo
		this.path = `/streams?teamId=${teamId}&repoId=${repoId}`;	// get all the streams for this repo
		callback();
	}
}

module.exports = GetAllStreamsByRepoTest;
