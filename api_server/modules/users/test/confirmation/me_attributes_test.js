'use strict';

const ConfirmationTest = require('./confirmation_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class MeAttributesTest extends ConfirmationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			numAdditionalInvites: 2
		});
		this.teamOptions.numAdditionalInvites = 2;
		//this.streamOptions.creatorIndex = 1;
		this.postOptions.creatorIndex = 1;
		this.postOptions.wantMarker = true;
	}
	
	get description () {
		return 'user should receive me-only attributes with response to email confirmation';
	}

	getExpectedFields () {
		// with the login request, we should get back a user object with attributes
		// only the user should see
		let response = Object.assign({}, super.getExpectedFields());
		response.user = [...response.user, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return response;
	}

	getUserData () {
		const data = this.userFactory.getRandomUserData();
		data.email = this.users[3].user.email;
		return data;
	}
			
	// validate the response to the test request
	validateResponse (data) {
		// validate that the user got a correct lastReads attribute when confirming
		Assert(data.user.lastReads[this.teamStream.id] === 0, 'lastReads should be 0');
		delete data.user.lastReads;	// so super.validateResponse will pass
		super.validateResponse(data);
	}
}

module.exports = MeAttributesTest;
