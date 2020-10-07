'use strict';

const AddMarkersTest = require('./add_markers_test');

class TooManyKnownCommitHashesTest extends AddMarkersTest {

	get description () {
		return 'should return an error when attempting to create a codemark with a marker element where the known commit hashes array has too many elements';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'too many known commit hashes'
		};
	}

	// form the data to use in trying to create the codemark
	makeTestData (callback) {
		// set the "remotes" field to an array of 101 elements
		super.makeTestData(() => {
			this.data.markers[0].knownCommitHashes = new Array(101).fill('x');
			callback();
		});
	}
}

module.exports = TooManyKnownCommitHashesTest;
