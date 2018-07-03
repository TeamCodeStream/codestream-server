// base class for many tests of the "POST /users" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const UserTestConstants = require('../user_test_constants');

class PostUserTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the user when creating (inviting) a user';
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
		if (this.existingUserData) {
			this.data = Object.assign({}, this.existingUserData.user, this.data);
		}
		const expectedCreatorId = this.wantExistingUser ?
			this.existingUserData.user.creatorId :
			this.currentUser._id;
		// verify we got a valid user object back, with the attributes epected
		const user = data.user;
		let errors = [];
		(user.secondaryEmails || []).sort();
		(this.data.secondaryEmails || []).sort();
		(user.teamIds || []).sort();
		const teamIds = [this.team._id];
		if (this.existingUserTeam) {
			teamIds.push(this.existingUserTeam._id);
			teamIds.sort();
		}
		(user.companyIds || []).sort();
		const companyIds = [this.company._id];
		if (this.existingUserCompany) {
			companyIds.push(this.existingUserCompany._id);
			companyIds.sort();
		}
		const result = (
			((user.email === this.data.email) || errors.push('incorrect email')) &&
			((JSON.stringify(user.secondaryEmails) === JSON.stringify(this.data.secondaryEmails)) || errors.push('secondaryEmails does not natch')) &&
			((user.fullName === this.data.fullName) || errors.push('incorrect full name')) &&
			((user.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof user.createdAt === 'number') || errors.push('createdAt not number')) &&
			((user.modifiedAt >= user.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((user.creatorId === expectedCreatorId) || errors.push('creatorId not correct')) &&
			((JSON.stringify(user.teamIds) === JSON.stringify(teamIds)) || errors.push('incorrect teamIds')) &&
			((JSON.stringify(user.companyIds) === JSON.stringify(companyIds)) || errors.push('incorrect companyIds'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		// verify the user in the response has no attributes that should not go to clients
		this.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PostUserTest;
