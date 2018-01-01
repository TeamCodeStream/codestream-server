'use strict';

var ACLTest = require('./acl_test');

class ACLRepoOnTheFlyTest extends ACLTest {

	constructor (options) {
		// modify the base ACLTest...
		super(options);
		this.withoutMeOnTeam = true;	// i won't be on the team that owns the stream in which i'll attempt to create a post
		this.onTheFly = true;			// the repo will be created on the fly with the post
		this.type = 'file';				// the stream will be a file-type
	}

	get description () {
		return `should return an error when trying to create a post in an on-the-fly file stream for a repo from a team that i\'m not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'not authorized for repo'
		};
	}
}

module.exports = ACLRepoOnTheFlyTest;
