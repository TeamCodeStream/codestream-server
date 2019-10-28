'use strict';

const MatchRepoTest = require('./match_repo_test');

class ReposRequiredTest extends MatchRepoTest {

	get description () {
		return 'should return an error when trying to match repos and repos is not specified';
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
			delete this.data.repos;
			callback();
		});
	}
}

module.exports = ReposRequiredTest;
