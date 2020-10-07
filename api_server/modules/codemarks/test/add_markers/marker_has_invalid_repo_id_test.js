'use strict';

const AddMarkersTest = require('./add_markers_test');

class MarkerHasInvalidRepoIdTest extends AddMarkersTest {

	get description () {
		return 'should return an error when attempting to add markers to a codemark with a marker element where the repo ID is not a valid ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker repo'
		};
	}

	// form the data to use in trying to create the codemark
	makeTestData (callback) {
		// we'll add a marker from a bogus stream ID
		super.makeTestData(() => {
			const marker = this.data.markers[0];
			delete marker.fileStreamId;
			marker.repoId = 'x';
			callback();
		});
	}
}

module.exports = MarkerHasInvalidRepoIdTest;
