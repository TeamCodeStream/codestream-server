'use strict';

const MatchRepoTest = require('./match_repo_test');

class MustByArrayTest extends MatchRepoTest {

	get description () {
		return `should return an error when trying to match repos and ${this.parameter} is not an array`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: `${this.parameter} must be an array`
		};
	}

	makeRequestData (callback) {
		super.makeRequestData(error => {
			if (error) { return callback(error); }
			this.data.repos[0][this.parameter] = 'x';
			callback();
		});
	}
}

module.exports = MustByArrayTest;
