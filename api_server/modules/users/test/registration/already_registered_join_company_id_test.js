'use strict';

const RegistrationTest = require('./registration_test');

class AlreadyRegisteredJoinCompanyIdTest extends RegistrationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		this.teamOptions.creatorIndex = 1;
		this.teamOptions.members = [];
	}

	get description () {
		return 'should be ok to register with an email that already exists as a registered and confirmed user, if joinCompanyId is specified during the registration';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.joinCompanyId = this.company.id;
			this.data.email = this.users[0].user.email;
			callback();
		});
	}
}

module.exports = AlreadyRegisteredJoinCompanyIdTest;
