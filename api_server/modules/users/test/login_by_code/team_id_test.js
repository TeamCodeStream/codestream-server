'use strict';

const InitialDataTest = require('./initial_data_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class TeamIdTest extends InitialDataTest {

	constructor (options) {
		super(options);
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

	validateResponse (data) {
		const { company, team, repo, streams } = this.otherCompanyResponses[1];
		Assert(data.companies.length === 1, 'no company in response');
		this.validateMatchingObject(company.id, data.companies[0], 'company');
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(team.id, data.teams[0], 'team');
		Assert(data.streams.length === 1, 'expected 1 stream');
		this.validateMatchingObject(streams[0].id, data.streams[0], 'teamStream');
	}
}

module.exports = TeamIdTest;
