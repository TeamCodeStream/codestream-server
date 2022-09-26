'use strict';

const AlreadyTakenTest = require('./already_taken_test');

class AlreadyTakenInOrgTest extends AlreadyTakenTest {

	constructor (options) {
		super(options);
		this.oneUserPerOrg = true; // ONE_USER_PER_ORG
		this.userOptions.numRegistered = 2;
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		const which = this.isRegistered ? 'registered' : 'unregistered';
		return `under one-user-per-org, should return an error when submitting a request to change email to the email of another (${which}) user in the same org`;
	}

	before (callback) {
		// after creating the user, invite them to our org
		super.before(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'post',
					path: '/users',
					data: {
						email: this.userResponse.user.email,
						teamId: this.team.id
					},
					token: this.users[1].accessToken
				},
				callback
			);
		});
	}
}

module.exports = AlreadyTakenInOrgTest;
