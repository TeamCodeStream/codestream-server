'use strict';

var GetRepoTest = require('./get_repo_test');

class ACLTest extends GetRepoTest {

	constructor (options) {
		super(options);
		this.withoutMe = true;	// create the repo but don't include current user in the team
	}

	get description () {
		return 'should return an error when trying to fetch a repo for a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// set the path to use in the test request
	setPath (callback) {
		// try to fetch the other repo
		this.path = '/repos/' + this.otherRepo._id;
		callback();
	}
}

module.exports = ACLTest;
