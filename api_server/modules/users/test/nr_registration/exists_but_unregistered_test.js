'use strict';

const NRRegistrationTest = require('./nr_registration_test');

class ExistsButUnregisteredTest extends NRRegistrationTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
		this.teamOptions.numAdditionalInvites = 0;
		this.userOptions.numUnregistered = 1;
	}

	get description () {
		const oneUserPerOrg = this.oneUserPerOrg ? ', under one-user-per-org' : '';
		return `should be ok to register a user using NR API key if a user record exists matching the email, but the user is unregistered${oneUserPerOrg}`;
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			const unregisteredUser = this.users.find(user => !user.user.isRegistered);
			this.apiRequestOptions.headers['X-CS-Mock-Email'] = unregisteredUser.user.email;
			Object.assign(this.expectedUserData, unregisteredUser.user, { fullName: this.apiRequestOptions.headers['X-CS-Mock-Name']});
			callback();
		});
	}
}

module.exports = ExistsButUnregisteredTest;
