'use strict';

var GrantTest = require('./grant_test');

class UserChannelACLTest extends GrantTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;	// we want a second registered user
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	get description () {
		return 'should return an error when requesting to grant access to me-channel for another user';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set to grant access to the other user's me-channel
		this.path = '/grant/user-' + this.otherUserData.user._id;
		callback();
	}
}

module.exports = UserChannelACLTest;
