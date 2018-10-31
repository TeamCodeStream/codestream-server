'use strict';

const MarkerTest = require('./marker_test');

class LocationMustBeNumbersTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a marker element where the location array does not contain all numbers';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: first four coordinations of location array must be numbers'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set an element in the location array to a non-numeric ... not allowed!
		super.makePostData(() => {
			this.data.markers[0].location = [1, 2, 'x', 4];
			callback();
		});
	}
}

module.exports = LocationMustBeNumbersTest;
