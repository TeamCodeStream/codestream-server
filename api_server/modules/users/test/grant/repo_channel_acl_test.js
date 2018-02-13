'use strict';

var GrantTest = require('./grant_test');

class RepoChannelACLTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;	// we want a second registered user
		this.wantForeignRepo = true;	// we want a repo and team that the current user is not a member of
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to a repo channel when i am not a member of the team that owns the repo';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set to grant access to the channel for the repo owned by a team the current user is not a member of
		this.path = '/grant/repo-' + this.foreignRepo._id;
		callback();
	}
}

module.exports = RepoChannelACLTest;
