'use strict';

var GetPostsTest = require('./get_posts_test');

class ACLTeamTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.withoutMeOnTeam = true;	// without me on the team, i won't be able to fetch the post, no matter what type the stream is
	}

	get description () {
		return 'should return an error when trying to fetch posts from a stream in a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLTeamTest;
