'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');

class BadLocationCoordinateTest extends PutMarkerLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations with a location coordinate that is not a number';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'first four coordinations of location array must be numbers'
		};
	}

	setData (callback) {
		super.setData(() => {
			let markerId = Object.keys(this.data.locations)[0];
			this.data.locations[markerId][3] = 'x';
			callback();
		});
	}
}

module.exports = BadLocationCoordinateTest;
