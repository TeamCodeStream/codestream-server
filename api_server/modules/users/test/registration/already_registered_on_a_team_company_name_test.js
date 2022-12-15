'use strict';

const AlreadyRegisteredCompanyNameTest = require('./already_registered_company_name_test');

class AlreadyRegisteredOnATeamCompanyNameTest extends AlreadyRegisteredCompanyNameTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 0;
	}

	get description () {
		return 'should be ok to register with an email that already exists as a registered and confirmed user on a team, if companyName is specified during the registration';
	}
}

module.exports = AlreadyRegisteredOnATeamCompanyNameTest;
