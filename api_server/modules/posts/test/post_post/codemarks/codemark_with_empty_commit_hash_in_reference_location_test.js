'use strict';

const CodemarkWithReferenceLocationsTest = require('./codemark_with_reference_locations_test');

class CodemarkWithEmptyCommitHashInReferenceLocation extends CodemarkWithReferenceLocationsTest {

	get description () {
		return 'should be ok to create a post with a codemark with a marker that has additional reference locations, but one of the reference locations has a zero-length commit hash, the marker location will not be saved';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the commit hash from the reference location to use in creating the codemark
		super.makePostData(() => {
			this.data.codemark.markers[0].referenceLocations[1].commitHash = '';
			callback();
		});
	}
}

module.exports = CodemarkWithEmptyCommitHashInReferenceLocation;
