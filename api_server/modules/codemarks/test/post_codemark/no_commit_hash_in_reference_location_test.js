'use strict';

const ReferenceLocationsTest = require('./reference_locations_test');

class NoCommitHashInReferenceLocation extends ReferenceLocationsTest {

	get description () {
		return 'should be ok to create a codemark with a marker that has additional reference locations, but one of the reference locations does not have a commit hash, but that reference location does not get saved with marker locations';
	}

	// form the data to use in trying to create the codemark
	makeCodemarkData (callback) {
		// remove the commit hash from the reference location to use in creating the codemark
		super.makeCodemarkData(() => {
			delete this.data.markers[0].referenceLocations[1].commitHash;
			callback();
		});
	}
}

module.exports = NoCommitHashInReferenceLocation;
