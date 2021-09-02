'use strict';

const PutCodeErrorTest = require('./put_code_error_test');
const Assert = require('assert');

class NoUpdateOtherAttributeTest extends PutCodeErrorTest {

	get description () {
		return `should not update ${this.attribute} even if sent in the request to update a code error`;
	}

	makeCodeErrorUpdateData (callback) {
		super.makeCodeErrorUpdateData(error => {
			if (error) { return callback(error); }
			this.data[this.attribute] = 'x'; // set bogus value for the attribute, it shouldn't matter
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		const set = data.codeError.$set;
		Assert(set[this.attribute] === undefined, 'attribute appears in the response');
		super.validateResponse(data);
	}
}

module.exports = NoUpdateOtherAttributeTest;
