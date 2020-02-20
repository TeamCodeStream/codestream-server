'use strict';

const ReferenceLocationsTest = require('./reference_locations_test');

class InvalidCommitHashInReferenceLocation extends ReferenceLocationsTest {

	get description () {
		return 'should return an error when attempting to create a codemark with a marker that has additional reference locations, but one of the reference locations has an invalid commit hash';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'location commitHash but be a string'
		};
	}

	// form the data to use in trying to create the codemark
	makeCodemarkData (callback) {
		// remove the commit hash from the reference location to use in creating the codemark
		super.makeCodemarkData(() => {
			this.data.markers[0].referenceLocations[1].commitHash = 1;
			callback();
		});
	}
}

module.exports = InvalidCommitHashInReferenceLocation;
