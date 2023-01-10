// base class for many tests of the "POST /users" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const UserTestConstants = require('../user_test_constants');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');

class PostUserTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		const unifiedIdentity = this.unifiedIdentityEnabled ? ' and unified identity' : ''
		return `should return the user when creating (inviting) a user, under one-user-per-org${unifiedIdentity}`;
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/users';
	}

	getExpectedFields () {
		return { user: UserTestConstants.EXPECTED_UNREGISTERED_USER_FIELDS };
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		const user = data.user;
		if (this.existingUserData) {
			this.data = Object.assign({}, this.existingUserData.user, this.data);
		}
		const errors = [];
		(user.teamIds || []).sort();
		const teamIds = [this.team.id];
		(user.companyIds || []).sort();
		const companyIds = [this.company.id];
		const expectedUsername = this.getExpectedUsername();
		const expectedFullName = this.getExpectedFullName();
		const expectedCreatorId = this.getExpectedCreatorId();
		const expectedEmail = this.data.email.trim();
		const result = (
			((user.id === user._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((user.email === expectedEmail) || errors.push('incorrect email')) &&
			((user.username === expectedUsername) || errors.push('incorrect username')) &&
			((user.fullName === expectedFullName) || errors.push('incorrect full name')) &&
			((user.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof user.createdAt === 'number') || errors.push('createdAt not number')) &&
			((user.modifiedAt >= user.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((user.creatorId === expectedCreatorId) || errors.push('creatorId not correct')) &&
			((JSON.stringify(user.teamIds) === JSON.stringify(teamIds)) || errors.push('incorrect teamIds')) &&
			((JSON.stringify(user.companyIds) === JSON.stringify(companyIds)) || errors.push('incorrect companyIds')) &&
			((user.phoneNumber === '') || errors.push('incorrect phoneNumber')) &&
			((user.iWorkOn === '') || errors.push('incorrect iWorkOn'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		Assert.deepEqual(user.providerIdentities, [], 'providerIdentities is not an empty array');
		if (!this.existingUserIsRegistered) {
			const userWasAlreadyInvited = this.wantExistingUser && this.existingUserAlreadyOnTeam;
			const lastInviteType = this.noLastInviteType ?
				undefined :
				(this.lastInviteType || (userWasAlreadyInvited ? 'reinvitation' : 'invitation'));
			Assert.strictEqual(user.lastInviteType, lastInviteType, 'lastInvteType not correct');
			const firstInviteType = this.noFirstInviteType ? undefined : (this.firstInviteType || 'invitation');
			Assert.strictEqual(user.firstInviteType, firstInviteType, 'firstInviteType not correct');
		}
		else {
			Assert(!user.inviteCode, 'user has an invite code but there should not be one');
		}

		// verify the user in the response has no attributes that should not go to clients
		this.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}

	getExpectedUsername () {
		// under ONE_USER_PER_ORG, we correctly inherit the username from the original user, even if unregistered
		if (this.wantExistingUser) {
			return this.existingUserData.user.username;
		}
		else {
			return this.expectedUsername || EmailUtilities.parseEmail(this.data.email.trim()).name;
		}
	}

	getExpectedFullName () {
		if (this.wantExistingUser) {
			return this.existingUserData.user.fullName;
		}
		else {
			return this.data.fullName;
		}
	}

	getExpectedCreatorId () {
		// NOTE: under one-user-per-org, the user record on an invite is a duplicate, and gets the 
		// creatorId of the inviter, even if the original user created themselves by registering
		// we can remove the oneUserPerOrg part of this check when we fully move to ONE_USER_PER_ORG
		return this.currentUser.user.id;
	}
}

module.exports = PostUserTest;
