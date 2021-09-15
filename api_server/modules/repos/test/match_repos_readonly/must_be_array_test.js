'use strict';

const MatchRepoTest = require('./match_repo_test');

class MustBeArrayTest extends MatchRepoTest {

	get description () {
		return `should return an error when trying to match repos in read-only mode and ${this.parameter} is not an array`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: `${this.parameter} must be an array`
		};
	}

	getRequestData () {
		const data = super.getRequestData();
		data.repos[0][this.parameter] = 'x';
		return data;
	}
}

module.exports = MustBeArrayTest;
