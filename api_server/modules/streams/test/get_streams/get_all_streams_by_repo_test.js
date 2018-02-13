'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetAllStreamsByRepoTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting all streams by repo ID';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		let repoId = this.myRepo._id;
		let teamId = this.myTeam._id;
		this.myStreams = this.streamsByRepo[repoId];	// these are the streams we expect to see in the response
		this.path = `/streams?teamId=${teamId}&repoId=${repoId}`;	// get all the streams for this repo
		callback();
	}
}

module.exports = GetAllStreamsByRepoTest;
