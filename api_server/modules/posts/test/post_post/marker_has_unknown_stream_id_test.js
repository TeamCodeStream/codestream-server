'use strict';

const CodeMarkMarkerTest = require('./codemark_marker_test');
const ObjectID = require('mongodb').ObjectID;

class MarkerHasUnknownStreamIdTest extends CodeMarkMarkerTest {

	get description () {
		return 'should return an error when attempting to create a post and codemark with a marker element where the stream ID is unknown';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker stream'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// we'll add a marker from a non-existent stream 
		super.makePostData(() => {
			this.data.codemark.markers[0].fileStreamId = ObjectID();
			callback();
		});
	}
}

module.exports = MarkerHasUnknownStreamIdTest;
