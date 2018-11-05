'use strict';

const MarkerTest = require('./marker_test');

class MarkerHasInvalidRepoIdTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create an codemark with a marker element where the repo ID is not a valid ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker repo'
		};
	}

	// form the data to use in trying to create the codemark
	makeCodeMarkData (callback) {
		// we'll add a marker from a bogus stream ID
		super.makeCodeMarkData(() => {
			const marker = this.data.markers[0];
			delete marker.fileStreamId;
			marker.repoId = 'x';
			callback();
		});
	}
}

module.exports = MarkerHasInvalidRepoIdTest;
