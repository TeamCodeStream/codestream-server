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
		this.companyData = [];
		BoundAsync.series(this, [
			this.createCompany,
			this.doLogin,
			this.inviteUser
		], callback);
	}

	// create a company
	createCompany (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies',
				data: { name: this.companyFactory.randomName() },
				token: this.users[0].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.currentCompanyToken = response.accessToken;
				callback();
			}
		);
	}

	// do a login for a particular company based on the access token passed when creating it
	doLogin (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				token: this.currentCompanyToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				const company = response.companies[0];
				this.expectedEligibleJoinCompanies.push({
					id: company.id,
					name: company.name,
					domainJoining: [],
					codeHostJoining: [],
					byInvite: true,
					memberCount: 1
				});
				this.currentCompanyTeamId = response.teams[0].id;
				callback();
			}
		);
	}

	// invite the user to company just created
	inviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.currentCompanyTeamId,
					email: this.data.email
				},
				token: this.currentCompanyToken
			},
			callback
		);
	}
}

module.exports = EligibleJoinCompaniesByInviteTest;
