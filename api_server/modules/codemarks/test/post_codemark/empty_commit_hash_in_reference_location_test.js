'use strict';

const ReferenceLocationsTest = require('./reference_locations_test');

class EmptyCommitHashInReferenceLocation extends ReferenceLocationsTest {

	get description () {
		return 'should be ok to create a codemark with a marker that has additional reference locations, but one of the reference locations has a zero-length commit hash, the reference location will not be stored in marker locations';
	}

	// form the data to use in trying to create the codemark
	makeCodemarkData (callback) {
		// remove the commit hash from the reference location to use in creating the codemark
		super.makeCodemarkData(() => {
			this.data.markers[0].referenceLocations[1].commitHash = '';
			callback();
		});
	}
}

module.exports = EmptyCommitHashInReferenceLocation;
