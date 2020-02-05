'use strict';

const AuthorsTest = require('./authors_test');

class AuthorNotOnTeamTest extends AuthorsTest {

	get description () {
		return 'should return an error when attempting to create a post with a review with a code author that is not on the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'must contain only users on the team'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [0, 1, 3, 4];
			callback();
		});
	}
}

module.exports = AuthorNotOnTeamTest;
