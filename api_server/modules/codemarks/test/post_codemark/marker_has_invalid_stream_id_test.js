'use strict';

const MarkerTest = require('./marker_test');

class MarkerHasInvalidStreamIdTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create an codemark with a marker element where the stream ID is not a valid ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker stream'
		};
	}

	// form the data to use in trying to create the codemark
	makeCodeMarkData (callback) {
		// we'll add a marker from a bogus stream ID
		super.makeCodeMarkData(() => {
			this.data.markers[0].fileStreamId = 'x';
			callback();
		});
	}
}

module.exports = MarkerHasInvalidStreamIdTest;
