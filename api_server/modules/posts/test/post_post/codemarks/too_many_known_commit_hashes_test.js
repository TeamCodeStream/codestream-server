'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');

class TooManyKnownCommitHashesTest extends CodemarkMarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a codemark with a marker element where the known commit hashes array has too many elements';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'too many known commit hashes'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set the "knownCommitHashes" field to an array of 101 elements
		super.makePostData(() => {
			this.data.codemark.markers[0].knownCommitHashes = new Array(101).fill('x');
			callback();
		});
	}
}

module.exports = TooManyKnownCommitHashesTest;
