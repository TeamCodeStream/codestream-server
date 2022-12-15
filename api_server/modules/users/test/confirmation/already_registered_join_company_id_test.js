'use strict';

const ConfirmationTest = require('./confirmation_test');

class AlreadyRegisteredJoinCompanyIdTest extends ConfirmationTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 2;
	}

	get description () {
		return 'should be ok to confirm a registration with an email that has already been confirmed, when the registration specified a company ID for the user to join';
	}

	getUserData () {
		const data = super.getUserData();
		data.email = this.users[0].user.email;
		data.companyName = this.companyFactory.randomName();
		return data;
	}
}

module.exports = AlreadyRegisteredJoinCompanyIdTest;
