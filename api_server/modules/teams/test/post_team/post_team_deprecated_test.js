'use strict';

const PostTeamTest = require('./post_team_test');

class PostTeamDeprecatedTest extends PostTeamTest {

	get description () {
		return 'should return error when attempting to directly create a team, support is deprecated';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = PostTeamDeprecatedTest;
