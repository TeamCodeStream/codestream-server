'use strict';

const AddMarkersTest = require('./add_markers_test');
const ObjectID = require('mongodb').ObjectID;

class MarkerHasUnknownStreamIdTest extends AddMarkersTest {

	get description () {
		return 'should return an error when attempting to add markers to a codemark with a marker element where the stream ID is unknown';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker stream'
		};
	}

	// form the data to use in trying to create the codemark
	makeTestData (callback) {
		// we'll add a marker from a non-existent stream 
		super.makeTestData(() => {
			this.data.markers[0].fileStreamId = ObjectID();
			callback();
		});
	}
}

module.exports = MarkerHasUnknownStreamIdTest;
