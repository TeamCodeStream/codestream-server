'use strict';

var GetPostsTest = require('./get_posts_test');

class ACLTeamFileTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.withoutMeOnTeam = true;	// without me on the team, i won't be able to fetch a post in a file-type stream
		this.type = 'file';	// make it a file-type stream, which have team-level ACL
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
