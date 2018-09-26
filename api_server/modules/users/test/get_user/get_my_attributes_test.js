'use strict';

const GetMyselfTest = require('./get_myself_test');
const UserTestConstants = require('../user_test_constants');
const Assert = require('assert');

class GetMyAttributesTest extends GetMyselfTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.teamOptions.inviterIndex = 1;
		this.teamOptions.numAdditionalInvites = 2;
		this.streamOptions.creatorIndex = 1;
		this.postOptions.creatorIndex = 1;
		this.postOptions.wantCodeBlock = true;
		this.id = 'me';	// this will be the "ID" of the user to fetch
	}

	get description () {
		return 'should return me-only attributes when requesting myself';
	}

	getExpectedFields () {
		// when fetching "myself", there are attributes i should see that no on else can see
		let userResponse = {};
		userResponse.user = [...UserTestConstants.EXPECTED_USER_FIELDS, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return userResponse;
	}

	validateResponse (data) {
		// verfiy we got a lastReads object, with an entry for the stream
		Assert(data.user.lastReads[this.stream._id] === 0, 'lastReads should be 0');
		super.validateResponse(data);
	}

	// validate that the received user data does not have any attributes a client shouldn't see
	validateSanitized (user) {
		// user can see attributes others can't
		super.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = GetMyAttributesTest;
