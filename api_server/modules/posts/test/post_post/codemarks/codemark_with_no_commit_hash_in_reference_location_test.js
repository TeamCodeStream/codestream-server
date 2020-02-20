'use strict';

const CodemarkWithReferenceLocationsTest = require('./codemark_with_reference_locations_test');

class CodemarkWithNoCommitHashInReferenceLocation extends CodemarkWithReferenceLocationsTest {

	get description () {
		return 'should be ok to create a post with a codemark with a marker that has additional reference locations, but one of the reference locations does not have a commit hash; no marker location will be saved';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the commit hash from the reference location to use in creating the codemark
		super.makePostData(() => {
			delete this.data.codemark.markers[0].referenceLocations[1].commitHash;
			callback();
		});
	}
}

module.exports = CodemarkWithNoCommitHashInReferenceLocation;
