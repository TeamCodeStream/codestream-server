'use strict';

var MatchRepoTest = require('./match_repo_test');

class NoAttributeTest extends MatchRepoTest {

	get description () {
		return `should return error when attempting to match a repo with no ${this.attribute} supplied`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// get query parameters used to make the path
	getQueryParameters () {
		// remove the specified attribute
		let queryParameters = super.getQueryParameters();
		delete queryParameters[this.attribute];
		return queryParameters;
	}
}

module.exports = NoAttributeTest;
