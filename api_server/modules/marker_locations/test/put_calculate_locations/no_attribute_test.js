'use strict';

var PutCalculateLocationsTest = require('./put_calculate_locations_test');

class NoAttributeTest extends PutCalculateLocationsTest {

	get description () {
		return `should return error when attempting to calculate marker locations with no ${this.attribute}`;
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
