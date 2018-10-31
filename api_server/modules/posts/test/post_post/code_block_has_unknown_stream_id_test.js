'use strict';

const MarkerTest = require('./marker_test');
const ObjectID = require('mongodb').ObjectID;

class MarkerHasUnknownStreamIdTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a marker element where the stream ID is unknown';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// we'll add a marker from a non-existent stream 
		super.makePostData(() => {
			this.data.markers[0].streamId = ObjectID();
			callback();
		});
	}
}

module.exports = MarkerHasUnknownStreamIdTest;
