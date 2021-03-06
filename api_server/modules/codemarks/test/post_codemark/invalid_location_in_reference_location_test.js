'use strict';

const ReferenceLocationsTest = require('./reference_locations_test');

class InvalidLocationInReferenceLocationTest extends ReferenceLocationsTest {

	get description () {
		return 'should return an error when attempting to create a codemark with a marker that has additional reference locations, but one of the reference locations has an invalid location object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid location'
		};
	}

	// form the data to use in trying to create the codemark
	makeCodemarkData (callback) {
		// remove the location from the reference location to use in creating the codemark
		super.makeCodemarkData(() => {
			this.data.markers[0].referenceLocations[1].location = 'x';
			callback();
		});
	}
}

module.exports = InvalidLocationInReferenceLocationTest;
