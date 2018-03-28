'use strict';

var MatchRepoTest = require('./match_repo_test');

class NoUrlTest extends MatchRepoTest {

	get description () {
		return 'should return error when attempting to match a repo with no url supplied';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'url'
		};
	}

	// make the path we'll use to run the test request
	makePath (callback) {
		// use the path with no url
		this.path = '/no-auth/match-repo';
		callback();
	}
}

module.exports = NoUrlTest;
