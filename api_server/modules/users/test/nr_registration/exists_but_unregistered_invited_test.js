'use strict';

const ExistsButUnregisteredTest = require('./exists_but_unregistered_test');

class ExistsButUnregisteredInvitedTest extends ExistsButUnregisteredTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
		this.userOptions.numUnregistered = 0;
		this.teamOptions.numAdditionalInvites = 1;
	}

	get description () {
		const oneUserPerOrg = this.oneUserPerOrg ? ', under one-user-per-org' : '';
		return `should be ok to register a user using NR API key if a user record exists matching the email, but the user is unregistered and already invited to a team${oneUserPerOrg}`;
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			if (!this.oneUserPerOrg) { // under ONE_USER_PER_ORG, user has not accepted the invite yet, so they aren't created by the inviter
				this.expectedCreatorId = this.users[0].user.id;
			}
			callback();
		});
	}
}

module.exports = ExistsButUnregisteredInvitedTest;
