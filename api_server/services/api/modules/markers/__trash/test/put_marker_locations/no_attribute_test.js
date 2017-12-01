'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');

class NoAttributeTest extends PutMarkerLocationsTest {

	get description () {
		return `should return error when attempting to put marker locations with no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1002',
			info: this.attribute
		};
	}

	setData (callback) {
		super.setData(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
