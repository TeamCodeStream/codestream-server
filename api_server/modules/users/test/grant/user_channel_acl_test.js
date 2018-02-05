'use strict';

var GrantTest = require('./grant_test');

class UserChannelACLTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to me-channel for another user';
	}

	setPath (callback) {
		this.path = '/grant/user-' + this.otherUserData.user._id;
		callback();
	}
}

module.exports = UserChannelACLTest;
