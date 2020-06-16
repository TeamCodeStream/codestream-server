'use strict';

const PostTeamTest = require('./post_team_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AttachToCompanyTest extends PostTeamTest {

	get description () {
		return 'when creating a team, should be able to attach to an existing company';
	}

	getExpectedFields () {
		const response = { ...super.getExpectedFields() };
		delete response.company;
		return response;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCompany
		], callback);
	}

	// create a second company to attach the team too
	createCompany (callback) {
		const token = this.otherUserCreatesCompany ? this.users[1].accessToken : this.token;
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies',
				data: {
					name: this.companyFactory.randomName()
				},
				token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.attachToCompany = response.company;
				this.data.companyId = response.company.id;
				callback();
			}
		);
	}
}

module.exports = AttachToCompanyTest;
