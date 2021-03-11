'use strict';

const GetMyselfTest = require('./get_myself_test');
const Assert = require('assert');
const UserAttributes = require('../../user_attributes');

class GetMyselfNoMeAttributesTest extends GetMyselfTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.teamOptions.numAdditionalInvites = 2;
		//this.streamOptions.creatorIndex = 1;
		this.postOptions.creatorIndex = 1;
		this.postOptions.wantMarker = true;
	}

	get description () {
		return 'should not return me-only attributes when requesting myself by id';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.id = this.currentUser.user.id; // we'll fetch "ourselves" but by our real ID, not by "me" ... this doesn't return me attributes
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// look for any "me-attributes" (attributes the requesting user can see but no other users should see) ...
		// with this request, we should NOT see any me-attributes
		let user = data.user;
		let foundMeAttributes = [];
		let meAttributes = Object.keys(UserAttributes).filter(attribute => UserAttributes[attribute].forMe);
		meAttributes.forEach(attribute => {
			if (user[attribute] !== undefined) {
				foundMeAttributes.push(attribute);
			}
		});
		Assert(foundMeAttributes.length === 0, 'response contains these me-only attributes: ' + foundMeAttributes.join(','));
	}
}

module.exports = GetMyselfNoMeAttributesTest;
