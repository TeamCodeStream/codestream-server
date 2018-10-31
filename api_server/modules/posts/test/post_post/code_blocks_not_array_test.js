'use strict';

const MarkerTest = require('./marker_test');

class MarkersNotArrayTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with markers attribute that is not an array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: must be an array of objects'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// use a "numeric" marker structure ... not allowed!
		super.makePostData(() => {
			this.data.markers = 1;
			callback();
		});
	}
}

module.exports = MarkersNotArrayTest;
