'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');

class InvalidCoordinateObjectTest extends PutMarkerLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations with a fifth location coordinate that is not an object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'fifth element of location must be an object'
		};
	}

	setData (callback) {
		super.setData(() => {
			let markerId = Object.keys(this.data.locations)[0];
			this.data.locations[markerId][4] = 1;
			callback();
		});
	}
}

module.exports = InvalidCoordinateObjectTest;
