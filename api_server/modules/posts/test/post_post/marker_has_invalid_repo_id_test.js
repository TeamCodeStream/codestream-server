'use strict';

const CodeMarkMarkerTest = require('./codemark_marker_test');

class MarkerHasInvalidRepoIdTest extends CodeMarkMarkerTest {

	get description () {
		return 'should return an error when attempting to create a post and codemark with a marker element where the repo ID is not a valid ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker repo'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// we'll add a marker from a bogus stream ID
		super.makePostData(() => {
			const marker = this.data.codemark.markers[0];
			delete marker.fileStreamId;
			marker.repoId = 'x';
			callback();
		});
	}
}

module.exports = MarkerHasInvalidRepoIdTest;
