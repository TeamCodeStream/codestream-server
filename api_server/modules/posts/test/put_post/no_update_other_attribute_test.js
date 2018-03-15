'use strict';

var PutPostTest = require('./put_post_test');
var Assert = require('assert');

class NoUpdateOtherAttributeTest extends PutPostTest {

	get description () {
		return `should not update ${this.attribute} even if sent in the request`;
	}

	// form the data for the post update
	makePostData (callback) {
		super.makePostData(() => {
			this.data[this.attribute] = 'x'; // set bogus value for the attribute, it shouldn't matter
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		let post = data.post;
		Assert(post[this.attribute] === undefined, 'attribute appears in the response');
		super.validateResponse(data);
	}
}

module.exports = NoUpdateOtherAttributeTest;
