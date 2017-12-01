'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');

class BadLocationTest extends PutMarkerLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations with a bad location';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'location must be an array'
		};
	}

	setData (callback) {
		super.setData(() => {
			let markerId = Object.keys(this.data.locations)[0];
			this.data.locations[markerId] = 1;
			callback();
		});
	}
}

module.exports = BadLocationTest;
