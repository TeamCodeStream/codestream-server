'use strict';

const InviteEmailTest = require('./invite_email_test');

class ExistingRegisteredOnTeamInviteEmailTest extends InviteEmailTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
		this.existingUserOnTeam = true;
	}

	get description () {
		return 'should send an invite email when inviting a user that already exists and is registered and is already on another team';
	}

}

module.exports = ExistingRegisteredOnTeamInviteEmailTest;
