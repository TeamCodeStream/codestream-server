'use strict';

const GetStreamsTest = require('./get_streams_test');

class NoRepoIdTest extends GetStreamsTest {

	get description () {
		return 'should return error if a no repo ID is provided in the query for file streams';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'queries for file streams require repoId'
		};
	}

	setPath (callback) {
		this.path = `/streams?teamId=${this.team._id}&type=file`;
		callback();
	}
}

module.exports = NoRepoIdTest;
