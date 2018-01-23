// base class for many tests of the "PUT /posts" requests

'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var CommonInit = require('./common_init');
const UserTestConstants = require('../user_test_constants');

class PutUserTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.attributes = this.attributes || ['username', 'firstName', 'lastName'];
	}

	get description () {
		return `should return the updated user when updating ${this.attributes.join(' and ')} for a user`;
	}

	get method () {
		return 'put';
	}

	getExpectedFields () {
		return { user: [...this.attributes, 'modifiedAt'] };
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back a user with the updated attributes
        let user = data.user;
        Assert(user._id === this.currentUser._id, 'returned user ID is not the same');
        this.attributes.forEach(attribute => {
        	Assert.equal(user[attribute], this.data[attribute], `${attribute} does not match`);
        });
        Assert(user.modifiedAt > this.modifiedAfter, 'modifiedAt is not greater than before the user was updated');
		// verify the user in the response has no attributes that should not go to clients
		this.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PutUserTest;
