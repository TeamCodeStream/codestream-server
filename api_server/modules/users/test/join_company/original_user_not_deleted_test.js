'use strict';

const JoinCompanyTest = require('./join_company_test');
const Assert = require('assert');

class OriginalUserNotDeletedtest extends JoinCompanyTest {

	get description () {
		const by = this.byDomainJoining ? 'domain joining' : 'invite';
		return `when a user joins a company by ${by}, and the user accepting the invite is on a team already, their original user record should NOT be deleted`;
	}

	before (callback) {
		super.before (error => {
			if (error) { return callback(error); }
			// have the original user create a company, since they are not yet on a team when they do this,
			// that should put them on the team for the company they created
			this.companyFactory.createRandomCompany(callback, { token: this.currentUser.accessToken });
		});
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			// try to fetch the original user, this should fail
			this.doApiRequest(
				{
					method: 'get',
					path: '/users/' + this.currentUser.user.id,
					token: this.currentUser.accessToken
				},
				(error, response) => {
					if (error) { return callback(error); }
					Assert(!response.user.deactivated, 'original user was deactivated');
					callback();
				}
			);
		});
	}
}

module.exports = OriginalUserNotDeletedtest;
