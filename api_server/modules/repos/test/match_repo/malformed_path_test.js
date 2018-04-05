'use strict';

var MatchRepoTest = require('./match_repo_test');

class MalformedPathTest extends MatchRepoTest {

	get description () {
		return 'should return empty info when the path supplied is malformed';
	}

	// get query parameters used to make the path
	getQueryParameters () {
		// use the path with a non-url-like url
		let queryParameters = super.getQueryParameters();
		queryParameters.url = 'x';
		this.matches = [];	// we expect no matches
		delete this.service;	
		delete this.org;
		return queryParameters;
	}
}

module.exports = MalformedPathTest;
