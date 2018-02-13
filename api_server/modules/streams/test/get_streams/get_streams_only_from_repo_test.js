'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetStreamsOnlyFromRepoTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting streams by ID from a given repo';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// we'll try to fetch a few streams from our repo, and one from the "foreign" repo, which we
		// don't have access to ... we should get back only the streams from our repo
		let teamId = this.myTeam._id;
		let repoId = this.myRepo._id;
		let foreignRepoId = this.foreignRepo._id;
		this.myStreams = [
			this.streamsByRepo[repoId][0],
			this.streamsByRepo[repoId][2]
		];
		let otherStreams = [
			this.streamsByRepo[foreignRepoId][1],
		];
		let allStreams = [...this.myStreams, ...otherStreams];
		let ids = allStreams.map(stream => stream._id);
		this.path = `/streams?teamId=${teamId}&repoId=${repoId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetStreamsOnlyFromRepoTest;
