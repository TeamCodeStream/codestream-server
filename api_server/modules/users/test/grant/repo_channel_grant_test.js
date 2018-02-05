'use strict';

var GrantTest = require('./grant_test');

class RepoChannelGrantTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
		this.wantRepo = true;
	}

	get description () {
		return 'should succeed when requesting to grant access to a repo channel when i am a member of the team the owns the repo';
	}

	setPath (callback) {
		this.path = '/grant/repo-' + this.repo._id;
		callback();
	}
}

module.exports = RepoChannelGrantTest;
