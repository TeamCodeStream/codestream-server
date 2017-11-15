'use strict';

var GetPostsTest = require('./get_posts_test');

class ACLTeamFileTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.withoutMeOnTeam = true;
		this.type = 'file';
	}

	get description () {
		return 'should return an error when trying to fetch posts from a file stream in a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLTeamFileTest;
