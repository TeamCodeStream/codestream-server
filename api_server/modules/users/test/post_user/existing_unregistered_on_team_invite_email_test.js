'use strict';

const InviteEmailTest = require('./invite_email_test');

class ExistingUnregisteredOnTeamInviteEmailTest extends InviteEmailTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserOnTeam = true;
	}

	get description () {
		return 'should send an invite email when inviting a user that already exists but is not registered, and is already on another team';
	}

}

module.exports = ExistingUnregisteredOnTeamInviteEmailTest;
