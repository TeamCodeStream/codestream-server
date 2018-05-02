'use strict';

const PutStreamTest = require('./put_stream_test');
const Assert = require('assert');

class NoUpdateOtherAttributeTest extends PutStreamTest {

	get description () {
		return `should not update ${this.attribute} even if sent in the request`;
	}

	// form the data for the stream update
	makeStreamData (callback) {
		super.makeStreamData(() => {
			this.data[this.attribute] = 'x'; // set bogus value for the attribute, it shouldn't matter
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		let stream = data.stream;
		Assert(stream[this.attribute] === undefined, 'attribute appears in the response');
		super.validateResponse(data);
	}
}

module.exports = NoUpdateOtherAttributeTest;
