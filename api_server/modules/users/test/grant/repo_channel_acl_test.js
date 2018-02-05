'use strict';

var GrantTest = require('./grant_test');

class RepoChannelACLTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
		this.wantForeignRepo = true;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to a repo channel when i am not a member of the team that owns the repo';
	}

	setPath (callback) {
		this.path = '/grant/repo-' + this.foreignRepo._id;
		callback();
	}
}

module.exports = RepoChannelACLTest;
