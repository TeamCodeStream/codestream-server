'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');

class BadTypeTest extends PutMarkerLocationsTest {

	get description () {
		return `should return error when attempting to put marker locations with a bad type for ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1002',
			info: this.attribute
		};
	}

	setData (callback) {
		super.setData(() => {
			this.data[this.attribute] = 1;
			callback();
		});
	}
}

module.exports = BadTypeTest;
