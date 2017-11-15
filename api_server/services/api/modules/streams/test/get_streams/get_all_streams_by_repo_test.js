'use strict';

var GetStreamsTest = require('./get_streams_test');

class GetAllStreamsByRepoTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams when requesting all streams by repo ID';
	}

	setPath (callback) {
		let repoId = this.myRepo._id;
		let teamId = this.myTeam._id;
		this.myStreams = this.streamsByRepo[repoId];
		this.path = `/streams?teamId=${teamId}&repoId=${repoId}`;
		callback();
	}
}

module.exports = GetAllStreamsByRepoTest;
