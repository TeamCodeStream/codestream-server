'use strict';

const RegistrationTest = require('./registration_test');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class InviteCodeDifferentEmailTest extends RegistrationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return valid user data when registering, the user should not be registered when using an invite code but not using the same email the invite code was sent for';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.inviteUser
		], callback);
	}

	// invite the user before registering ... the user will use the invite code, but will provide
	// a different email than the invite was for ... this should then look like a normal registration,
	inviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.team.id,
					email: this.data.email,
					_pubnubUuid: this.data._pubnubUuid,
					_confirmationCheat: SecretsConfig.confirmationCheat
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data.email = this.userFactory.randomEmail();
				this.data.inviteCode = response.inviteCode;
				this.expectedCreatorId = this.currentUser.user.id;
				this.expectedVersion = 2;
				callback();
			}
		);
	}

	validateResponse (data) {
		const { user } = data;
		
		// these values are only present for an invited user that then registers, 
		// we'll check them first, then delete them and pass the user on to the base-class validation
		Assert.equal(user.numInvites, 1, 'numInvites should be 1');
		Assert.equal(user.internalMethod, 'invitation', 'internalMethod should be "invitation"');
		Assert.equal(user.internalMethodDetail, this.currentUser.user.id, 'internalMethodDetail should be equal to the inviting user');
		delete user.numInvites;
		delete user.internalMethod;
		delete user.internalMethodDetail;
		super.validateResponse(data);
	}
}

module.exports = InviteCodeDifferentEmailTest;
