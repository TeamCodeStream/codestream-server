'use strict';

const UnregisteredInviteTest = require('./unregistered_invite_test');
const Assert = require('assert');

class DontSendEmailTest extends UnregisteredInviteTest {

	get description () {
		return 'an unregistered user should not get analytics related updates when invited, when the dontSendEmail flag is set';
	}

	// form the data for the user update
	makeUserData (callback) {
		// add dontSendEmail flag
		this.noLastInviteType = this.noFirstInviteType = true;
		super.makeUserData(() => {
			this.data.dontSendEmail = true;
			callback();
		});
	}

	// verify that the created user was properly updated
	verifyUserUpdate (callback) {
		const user = this.confirmedUser;
		Assert(typeof user.internalMethod === 'undefined', 'internalMethod is defined');
		Assert(typeof user.internalMethodDetail === 'undefined', 'internalMethodDetail is defined');
		Assert(typeof user.numInvites === 'undefined', 'numInvites is defined');
		callback();
	}
}

module.exports = DontSendEmailTest;
