'use strict';

const MarkerTest = require('./marker_test');

class InvalidFileTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a marker element with a file that is not a string';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid file'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set a file part of the marker that is numeric instead of the required string
		super.makePostData(() => {
			this.data.markers[0].file = 1;
			callback();
		});
	}
}

module.exports = InvalidFileTest;
