'use strict';

const MarkerTest = require('./marker_test');
const ObjectId = require('mongodb').ObjectId;

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
	makeCodemarkData (callback) {
		// we'll add a marker from a non-existent stream 
		super.makeCodemarkData(() => {
			this.data.markers[0].fileStreamId = ObjectId();
			callback();
		});
	}
}

module.exports = MarkerHasUnknownStreamIdTest;
