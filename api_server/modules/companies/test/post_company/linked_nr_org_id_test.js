'use strict';

const PostCompanyTest = require('./post_company_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class LinkedNROrgIdTest extends PostCompanyTest {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}
	
	get description () {
		return 'when a user creates a second company, the company should be given a linked New Relic organization ID';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.getTeam,
			this.confirmNROrgId
		], callback);
	}

	getTeam (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/teams/' + this.responseData.teamId,
				token: this.responseData.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.createdTeam = response.team;
				callback();
			}
		)
	}
	confirmNROrgId (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/companies/' + this.createdTeam.companyId,
				token: this.responseData.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				const { company } = response;
				Assert.strictEqual(typeof company.linkedNROrgId, 'string', 'linkedNROrgId not set');
				//Assert.strictEqual(company.codestreamOnly, true, 'codestreamOnly flag not set');
				//Assert.strictEqual(company.orgOrigination, 'CS', 'orgOrigination is incorrect');
				callback();
			}
		)
	}
}

module.exports = LinkedNROrgIdTest;
