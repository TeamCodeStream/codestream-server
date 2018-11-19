'use strict';

const PostCodemarkTest = require('./post_codemark_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const RandomString = require('randomstring');
const Assert = require('assert');

class ParentPostIdTest extends PostCodemarkTest {

	get description () {
		return 'should be ok to provide an arbitrary parentPostId when creating an codemark tied to a third-party post';
	}

	getExpectedFields () {
		const expectedFields = DeepClone(super.getExpectedFields());
		expectedFields.codemark.push('parentPostId');
		return expectedFields;
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			this.data.parentPostId = RandomString.generate(10);
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(data.codemark.parentPostId, this.data.parentPostId, 'returned parentPostId does not match the given parentPostId');
		super.validateResponse(data);
	}
}

module.exports = ParentPostIdTest;
