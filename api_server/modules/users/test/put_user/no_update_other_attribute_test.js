'use strict';

const PutUserTest = require('./put_user_test');
const Assert = require('assert');

class NoUpdateOtherAttributeTest extends PutUserTest {

	get description () {
		return `should not update ${this.otherAttribute} even if sent in the request to update a user`;
	}

	// form the data for the post update
	makePostData (callback) {
		super.makeUserData(() => {
			this.data[this.otherAttribute] = 'x'; // set bogus value for the attribute, it shouldn't matter
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		const setData = data.user.$set;
		Assert(setData[this.otherAttribute] === undefined, 'attribute appears in the response');
		super.validateResponse(data);
	}
}

module.exports = NoUpdateOtherAttributeTest;
