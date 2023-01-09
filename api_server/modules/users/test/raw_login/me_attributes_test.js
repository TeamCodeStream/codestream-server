'use strict';

const LoginTest = require('./login_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class MeAttributesTest extends LoginTest {

	constructor (options) {
		super(options);
		this.firstSessionShouldBeUndefined = true;
		this.userOptions.numRegistered = 2;
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			numAdditionalInvites: 2
		});
		//this.streamOptions.creatorIndex = 1;
		this.postOptions.creatorIndex = 1;
		this.postOptions.wantMarker = true;
	}

	get description () {
		return 'user should receive me-only attributes with response to a raw login';
	}

	getExpectedFields () {
		// with the login request, we should get back a user object with attributes
		// only the user should see
		let response = Object.assign({}, super.getExpectedFields());
		response.user = [...response.user, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return response;
	}

	// validate the response to the test request
	validateResponse (data) {
		// verfiy we got a lastReads object, with an entry for the stream
		Assert(data.user.lastReads[this.teamStream.id] === 0, 'lastReads should be 0');
		delete data.user.lastReads;	// so super.validateResponse will pass
		super.validateResponse(data);
	}
}

module.exports = MeAttributesTest;
