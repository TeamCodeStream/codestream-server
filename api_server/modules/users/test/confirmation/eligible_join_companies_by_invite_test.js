'use strict';

const EligibleJoinCompaniesTest = require('./eligible_join_companies_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class EligibleJoinCompaniesByInviteTest extends EligibleJoinCompaniesTest {

	get description () {
		return 'user should receive eligible companies to join via domain-based and code-host-based, as well as invite, with response to email confirmation';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCompaniesAndInvite
		], callback);
	}

	// create companies that the confirming user has been invited to
	createCompaniesAndInvite (callback) {
		BoundAsync.timesSeries(
			this,
			2,
			this.createCompanyAndInvite,
			callback
		);
	}

	// create a company and then invite the confirming user to it
	createCompanyAndInvite (n, callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.expectedEligibleJoinCompanies.push({
					id: response.company.id,
					name: response.company.name,
					domainJoining: [],
					codeHostJoining: [],
					byInvite: true,
					memberCount: 1
				});
				this.inviteUser(response.company.teamIds[0], callback);
			},
			{
				token: this.users[0].accessToken
			}
		);
	}
	
	// invite the user to company just created
	inviteUser (teamId, callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId,
					email: this.data.email
				},
				token: this.users[0].accessToken
			},
			callback
		);
	}
}

module.exports = EligibleJoinCompaniesByInviteTest;
