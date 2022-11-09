'use strict';

const IdentityMatchTest = require('./identity_match_test');
const Assert = require('assert');

class ExistingUserTest extends IdentityMatchTest {

	get description () {
		const invite = this.userIsInvited ? ', when user is invited to a team' : '';
		const oneUserPerOrg = this.oneUserPerOrg ? ', under one-user-per-org' : '';
		const status = this.isRegistered ? 'registered' : 'unregistered';
		return `should be ok to complete a ${this.provider} authorization flow when a(n) ${status} user with matching email is already on CodeStream${invite}${oneUserPerOrg}`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			if (this.userIsInvited) {
				this.teamOptions.creatorIndex = 1;
				this.userOptions.numRegistered = 2;
				this.userOptions.numUnregistered = this.isRegistered ? 0 : 1;
				this.userIndex = this.isRegistered ? 0 : 2;
			} else {
				this.userOptions.numRegistered = this.isRegistered ? 1 : 0;
				this.userOptions.numUnregistered = this.isRegistered ? 0 : 1;
				this.userIndex = 0;
			}
			callback();
		});
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		parameters._mockEmail = this.users[this.userIndex].user.email;
		return parameters;
	}

	validateResponse (data) {
		if (this.oneUserPerOrg && this.userIsInvited && !this.isRegistered) {
			Assert.notStrictEqual(data.user.id, this.users[this.userIndex].user.id, 'id of matched user was the id of an invited unregistered user and should not have been under one-user-per-org');
		} else {
			Assert.strictEqual(data.user.id, this.users[this.userIndex].user.id, 'id of matched user did not correspond to the id of the expected unregistered user');
		}
		super.validateResponse(data);
	}
}

module.exports = ExistingUserTest;
