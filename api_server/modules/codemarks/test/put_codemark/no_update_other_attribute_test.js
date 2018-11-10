'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const Assert = require('assert');

class NoUpdateOtherAttributeTest extends PutCodemarkTest {

	get description () {
		return `should not update ${this.attribute} even if sent in the request to update a codemark`;
	}

	makeCodemarkUpdateData (callback) {
		super.makeCodemarkUpdateData(error => {
			if (error) { return callback(error); }
			this.data[this.attribute] = 'x'; // set bogus value for the attribute, it shouldn't matter
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		const set = data.codemark.$set;
		Assert(set[this.attribute] === undefined, 'attribute appears in the response');
		super.validateResponse(data);
	}
}

module.exports = NoUpdateOtherAttributeTest;
