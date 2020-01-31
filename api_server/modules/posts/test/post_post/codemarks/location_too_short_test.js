'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');

class LocationTooShortTest extends CodemarkMarkerTest {

	get description () {
		return 'should return an error when attempting to create a post and codemark with a marker element where the location array is too short';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'location array must have at least 4 elements'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// 3 elements in the location array ... not allowed!
		super.makePostData(() => {
			this.data.codemark.markers[0].location = [1, 2, 3];
			callback();
		});
	}
}

module.exports = LocationTooShortTest;
