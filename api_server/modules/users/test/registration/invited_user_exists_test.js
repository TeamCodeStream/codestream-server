'use strict';

const RegistrationTest = require('./registration_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class InvitedUserExistsTest extends RegistrationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.teamOptions.creatorIndex = 0;
	}

	get description () {
		if (this.oneUserPerOrg) { // ONE_USER_PER_ORG
			return 'when trying to register as a user that exists, but has been invited to a team, should return a newly created user, under one-user-per-org';
		} else {
			return 'when trying to register as a user that exists, and has been invited to a team, should return the existing user, until one-user-per-org is supported';
		}
	}

	getExpectedFields () {
		if (this.oneUserPerOrg) { // ONE_USER_PER_ORG
			return UserTestConstants.EXPECTED_REGISTRATION_RESPONSE;
		} else {
			return { user: [
				...UserTestConstants.EXPECTED_REGISTRATION_FIELDS,
				...UserTestConstants.EXPECTED_INVITE_FIELDS
			]};
		}
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.inviteUser
		], callback);
	}

	inviteUser (callback) {
		// invite a random user to the org
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.userFactory.randomEmail(),
					teamId: this.team.id
				},
				token: this.users[0].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.userId = response.user.id;
				this.data = this.userFactory.getRandomUserData();
				this.data.email = response.user.email;
				this.data._confirmationCheat = this.apiConfig.sharedSecrets.confirmationCheat;
				if (!this.oneUserPerOrg) { // ONE_USER_PER_ORG
					this.expectedVersion = 2;	// version will be bumped
				}
				callback();
			}
		)
	}

	validateResponse (data) {
		if (this.oneUserPerOrg) { // ONE_USER_PER_ORG
			Assert.notStrictEqual(data.user.id, this.userId, 'ID of returned user is equal to existing user created, but should be different');
		} else {
			this.expectedCreatorId = this.users[0].user.id;
			Assert.strictEqual(data.user.id, this.userId, 'ID of returned user not equal to existing user created, but should be the same');
		}
		return super.validateResponse(data);
	}
}

module.exports = InvitedUserExistsTest;
