'use strict';

const JoinCompanyTest = require('./join_company_test');
const Assert = require('assert');

class OriginalUserDeletedtest extends JoinCompanyTest {

	get description () {
		const by = this.byDomainJoining ? 'domain joining' : 'invite';
		return `when a user joins a company by ${by}, their original user record should be deleted if it isn't already on a team`;
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
					Assert(response.user.deactivated, 'original user was not deactivated');
					callback();
				}
			);
		});
	}
}

module.exports = OriginalUserDeletedtest;
