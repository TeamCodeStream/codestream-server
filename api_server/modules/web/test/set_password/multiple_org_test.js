'use strict';

const SetPasswordTest = require('./set_password_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class MultipleOrgTest extends SetPasswordTest {

	get description () {
		return 'when setting a password using the forgot-password flow, the password should be set in all orgs the user belongs to, under one-user-per-org';
	}
	
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCompanies
		], callback);
	}

	createCompanies (callback) {
		this.otherCompanies = [];
		BoundAsync.timesSeries(
			this,
			3,
			this.createCompany,
			callback
		);
	}

	createCompany (n, callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherCompanies.push(response);
				callback();
			},
			{
				token: this.token
			}
		);
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.loginToCompanies
		], callback);
	}

	loginToCompanies (callback) {
		BoundAsync.timesSeries(
			this,
			3,
			this.loginToCompany,
			callback
		);
	}

	loginToCompany (n, callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/login',
				data: {
					email: this.currentUser.user.email,
					password: this.newPassword,
					teamId: this.otherCompanies[n].team.id
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.strictEqual(response.companies[0].id, this.otherCompanies[n].company.id, 'not logged into the proper company');
				callback();
			}
		);
	}
}

module.exports = MultipleOrgTest;
