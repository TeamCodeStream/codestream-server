'use strict';

var ACLTest = require('./acl_test');

class ACLTeamOnTheFlyTest extends ACLTest {

	constructor (options) {
		// modify the base ACLTest...
		super(options);
		this.withoutMeOnTeam = true;	// i won't be on the team for which i'm trying to create a post in an on-the-fly stream
		this.onTheFly = true;			// the stream will be created on-the-fly with the post
	}

	get description () {
		return 'should return an error when trying to create a post in an on-the-fly stream for a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'user not on team'
		};
	}
}

module.exports = ACLTeamOnTheFlyTest;
