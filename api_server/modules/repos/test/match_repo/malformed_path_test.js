'use strict';

var MatchRepoTest = require('./match_repo_test');

class MalformedPathTest extends MatchRepoTest {

	get description () {
		return 'should return empty info when the path supplied is malformed';
	}

	// make the path we'll use to run the test request
	makePath (callback) {
		// use the path with a non-url-like url
		this.path = '/no-auth/match-repo?url=x';
		this.matches = [];	// we expect no matches
		callback();
	}
}

module.exports = MalformedPathTest;
