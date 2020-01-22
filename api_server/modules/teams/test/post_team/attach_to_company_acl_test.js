'use strict';

const AttachToCompanyTest = require('./attach_to_company_test');

class AttachToCompanyACLTest extends AttachToCompanyTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 0;
		this.otherUserCreatesCompany = true;
	}

	get description () {
		return 'when creating a team attached to an existing company, should return an error if the user is not a member of the existing company';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'user can only attach a team to a company they are a member of'
		};
	}
}

module.exports = AttachToCompanyACLTest;
