'use strict';

const RegistrationTest = require('./registration_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AlreadyRegisteredOnATeamJoinCompanyIdTest extends RegistrationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		this.teamOptions.creatorIndex = 1;
		this.teamOptions.members = [];
	}

	get description () {
		return 'should be ok to register with an email that already exists as a registered and confirmed user on a team, if joinCompanyId is specified during the registration';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCompany,
			this.inviteUser
		], callback);
	}

	createCompany (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.createCompanyResponse = response;
				this.data.email = this.currentUser.user.email;
				this.data.joinCompanyId = this.createCompanyResponse.company.id;
				callback();
			},
			{ 
				token: this.users[1].accessToken 
			}
		);
	}

	inviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.currentUser.user.email,
					teamId: this.createCompanyResponse.company.everyoneTeamId
				},
				token: this.createCompanyResponse.accessToken
			},
			callback
		);
	}
}

module.exports = AlreadyRegisteredOnATeamJoinCompanyIdTest;
