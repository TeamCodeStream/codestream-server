'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');
const ObjectId = require('mongodb').ObjectId;

class MarkerHasUnknownRepoIdTest extends CodemarkMarkerTest {

	get description () {
		return 'should return an error when attempting to create a post and codemark with a marker element where the repo ID is unknown';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker repo'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// we'll add a marker from a non-existent stream 
		super.makePostData(() => {
			const marker = this.data.codemark.markers[0];
			delete marker.fileStreamId;
			marker.repoId = ObjectId();
			callback();
		});
	}
}

module.exports = MarkerHasUnknownRepoIdTest;
