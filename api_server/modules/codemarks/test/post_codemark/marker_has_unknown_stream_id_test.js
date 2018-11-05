'use strict';

const MarkerTest = require('./marker_test');
const ObjectID = require('mongodb').ObjectID;

class MarkerHasUnknownStreamIdTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create an codemark with a marker element where the stream ID is unknown';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker stream'
		};
	}

	// form the data to use in trying to create the codemark
	makeCodeMarkData (callback) {
		// we'll add a marker from a non-existent stream 
		super.makeCodeMarkData(() => {
			this.data.markers[0].fileStreamId = ObjectID();
			callback();
		});
	}
}

module.exports = MarkerHasUnknownStreamIdTest;
