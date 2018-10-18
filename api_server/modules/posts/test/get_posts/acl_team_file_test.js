'use strict';

const GetPostsTest = require('./get_posts_test');

class ACLTeamFileTest extends GetPostsTest {

	constructor (options) {
		options = Object.assign(options || {}, { type: 'file' });
		super(options);
		this.teamOptions.members = [];
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
