'use strict';

const ItemMarkerTest = require('./item_marker_test');

class LocationMustBeNumbersTest extends ItemMarkerTest {

	get description () {
		return 'should return an error when attempting to create a post and item with a marker element where the location array does not contain all numbers';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'first four coordinations of location array must be numbers'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set an element in the location array to a non-numeric ... not allowed!
		super.makePostData(() => {
			this.data.item.markers[0].location = [1, 2, 'x', 4];
			callback();
		});
	}
}

module.exports = LocationMustBeNumbersTest;
