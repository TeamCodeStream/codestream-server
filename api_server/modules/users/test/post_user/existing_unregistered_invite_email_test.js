'use strict';

const InviteEmailTest = require('./invite_email_test');

class ExistingUnregisteredInviteEmailTest extends InviteEmailTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
	}

	get description () {
		return 'should send an invite email when inviting a user that already exists but is unregistered';
	}

}

module.exports = ExistingUnregisteredInviteEmailTest;
