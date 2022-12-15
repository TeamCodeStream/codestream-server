'use strict';

const JoinOnConfirmTest = require('./join_on_confirm_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class JoinOnConfirmEmailTakenTest extends JoinOnConfirmTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		this.teamOptions.members = [];
	}

	get description () {
		return 'when a registered user signs up and confirms, if a company to join is specified, but the user registers with the email of a user already registered in the company, an error should be returned';
	}

	getExpectedError () {
		return {
			code: 'USRC-1025'
		};
	}

	inviteUser (callback) {
		// after inviting the previous user, also invite another registered user, 
		// and accept the invite ... then try to register with that user's email
		BoundAsync.series(this, [
			super.inviteUser,
			this.inviteSecondUser,
			this.acceptInvite
		], callback);
	}

	inviteSecondUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.users[1].user.email,
					teamId: this.createCompanyResponse.team.id
				},
				token: this.createUserResponse.accessToken
			},
			callback
		);
	}

	acceptInvite (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/join-company/' + this.createCompanyResponse.company.id,
				token: this.users[1].accessToken
			},
			callback
		)
	}
	
	getUserData () {
		const data = super.getUserData();
		data.email = this.users[1].user.email;
		return data;
	}
}

module.exports = JoinOnConfirmEmailTakenTest;
