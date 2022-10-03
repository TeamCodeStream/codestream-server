'use strict';

const LoginByCodeTest = require('./login_by_code_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class TeamIdTest extends LoginByCodeTest {

	constructor (options) {
		super(options);
		this.oneUserPerOrg = true;
		this.dontCheckFirstSession = true;
	}

	get description () {
		return `under one-user-per-org, when logging in via login code, user should be able to login to the correct team`;
	}

	generateLoginCode (callback) {
		BoundAsync.series(this, [
			this.createOtherCompanies,
			this.setData,
			super.generateLoginCode
		], callback);
	}

	createOtherCompanies (callback) {
		this.otherCompanyResponses = [];
		BoundAsync.timesSeries(
			this,
			3,
			this.createOtherCompany,
			callback
		);
	}

	createOtherCompany (n, callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherCompanyResponses.push(response);
				callback();
			},
			{
				token: this.currentUser.accessToken
			}
		);
	}

	setData (callback) {
		this.useTeamId = this.otherCompanyResponses[1].team.id;
		callback();
	}
}

module.exports = TeamIdTest;
