'use strict';

const MatchRepoTest = require('./match_repo_test');

class ReposRequiredTest extends MatchRepoTest {

	get description () {
		return 'should return an error when trying to match repos and repos is not specified (in read-only mode)';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'repos'
		};
	}

	makeRequestData (callback) {
		super.makeRequestData(error => {
			if (error) { return callback(error); }
			this.path = `/repos/match/${this.team.id}`;
			callback();
		});
	}
}

module.exports = ReposRequiredTest;
