'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');

class NoAttributeTest extends PutMarkerLocationsTest {

	get description () {
		return `should return error when attempting to put marker locations with no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// set the data to be used in the request that triggers the message
	setData (callback) {
		super.setData(() => {
			// delete the attribute from the data for the request
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
