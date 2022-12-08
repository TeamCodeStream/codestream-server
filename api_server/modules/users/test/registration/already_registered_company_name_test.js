'use strict';

const RegistrationTest = require('./registration_test');

class AlreadyRegisteredCompanyNameTest extends RegistrationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
	}

	get description () {
		return 'should be ok to register with an email that already exists as a registerd and confirmed user, if companyName is specified during the registration';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = this.users[0].user.email;
			this.data.companyName = this.companyFactory.randomName();
			callback();
		});
	}
}

module.exports = AlreadyRegisteredCompanyNameTest;
