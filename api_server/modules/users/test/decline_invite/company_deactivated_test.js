'use strict';

const DeclineInviteTest = require('./decline_invite_test');

class CompanyDeactivatedTest extends DeclineInviteTest {

	get description () {
		return 'should return an error when trying to decline an invite from a company that has been deactivated';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'company'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// deactivate the company
			this.doApiRequest(
				{
					method: 'delete',
					path: '/companies/' + this.company.id,
					token: this.users[1].accessToken
				},
				callback
			);
		});
	}
}

module.exports = CompanyDeactivatedTest;
