'use strict';

var GrantTest = require('./grant_test');

class RepoChannelGrantTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;	// we want a second registered user
		this.wantRepo = true;		// we want a repo for the test
	}

	get description () {
		return 'should succeed when requesting to grant access to a repo channel when i am a member of the team the owns the repo';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set to grant access to the channel for the repo in the current user's team
		this.path = '/grant/repo-' + this.repo._id;
		callback();
	}
}

module.exports = RepoChannelGrantTest;
