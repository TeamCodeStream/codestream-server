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
		const teamId = this.team._id;
		const repoId = this.repo._id;
		const foreignRepoId = this.foreignRepo._id;
		this.expectedStreams = [
			this.streamsByRepo[repoId][0],
			this.streamsByRepo[repoId][2]
		];
		const otherStreams = [
			this.streamsByRepo[foreignRepoId][1],
		];
		const allStreams = [...this.expectedStreams, ...otherStreams];
		const ids = allStreams.map(stream => stream._id);
		this.path = `/streams?teamId=${teamId}&repoId=${repoId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsOnlyFromRepoTest;
