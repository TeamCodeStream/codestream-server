'use strict';

const InviteEmailTest = require('./invite_email_test');

class ExistingRegisteredInviteEmailTest extends InviteEmailTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
	}

	get description () {
		return 'should send an invite email when inviting a user that already exists and is registered';
	}

}

module.exports = ExistingRegisteredInviteEmailTest;
