'use strict';

const ConfirmationTest = require('./confirmation_test');
const Assert = require('assert');

class ConfirmInvitedUserTest extends ConfirmationTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 0;
		Object.assign(this.userOptions, {
			numRegistered: 1,
			numUnregistered: 1
		});
	}

	get description () {
		if (this.oneUserPerOrg) {  // ONE_USER_PER_ORG
			return 'when confirming a user that has been invited to a team, as of one-user-per-org implementation, a copy of the originally registered user should be created and confirmed';
		} else {
			return 'should be able to confirm a user that has been invited to a team, before one-user-per-org implementation';
		}
	}

	getUserData () {
		const data = this.userFactory.getRandomUserData();
		data.email = this.users[1].user.email;
		return data;
	}

	validateResponse (data) {
		if (this.oneUserPerOrg) {
			Assert.notStrictEqual(data.user.id, this.users[1].user.id, 'user returned after confirmation does not match the expected user');
		} else {
			Assert.strictEqual(data.user.id, this.users[1].user.id, 'user returned after confirmation is the originally unregsitered user');
		}
		return super.validateResponse(data);
	}
}

module.exports = ConfirmInvitedUserTest;
