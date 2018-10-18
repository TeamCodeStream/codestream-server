'use strict';

const PutMarkerTest = require('./put_marker_test');
const Assert = require('assert');

class NoUpdateOtherAttributeTest extends PutMarkerTest {

	get description () {
		return `should not update ${this.attribute} even if sent in the request`;
	}

	// form the data for the marker update
	makeMarkerData (callback) {
		super.makeMarkerData(() => {
			this.data[this.attribute] = 'x'; // set bogus value for the attribute, it shouldn't matter
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		let marker = data.marker;
		Assert(marker[this.attribute] === undefined, 'attribute appears in the response');
		super.validateResponse(data);
	}
}

module.exports = NoUpdateOtherAttributeTest;
