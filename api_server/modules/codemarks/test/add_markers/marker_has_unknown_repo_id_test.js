'use strict';

const AddMarkersTest = require('./add_markers_test');
const ObjectID = require('mongodb').ObjectID;

class MarkerHasUnknownRepoIdTest extends AddMarkersTest {

	get description () {
		return 'should return an error when attempting to add markers to a codemark with a marker element where the repo ID is unknown';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker repo'
		};
	}

	// form the data to use in trying to create the codemark
	makeTestData (callback) {
		// we'll add a marker from a non-existent stream 
		super.makeTestData(() => {
			const marker = this.data.markers[0];
			delete marker.fileStreamId;
			marker.repoId = ObjectID();
			callback();
		});
	}
}

module.exports = MarkerHasUnknownRepoIdTest;
