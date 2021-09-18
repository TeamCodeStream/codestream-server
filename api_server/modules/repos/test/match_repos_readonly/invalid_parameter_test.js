'use strict';

const MatchRepoTest = require('./match_repo_test');

class InvalidParameterTest extends MatchRepoTest {

	get description () {
		return 'should return an error when trying to match repos and repos is not valid json';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: 'JSON parse failed'
		};
	}

	makeRequestData (callback) {
		super.makeRequestData(error => {
			if (error) { return callback(error); }
			this.path = `/repos/match/${this.team.id}?repos=x`;
			callback();
		});
	}
}

module.exports = InvalidParameterTest;
