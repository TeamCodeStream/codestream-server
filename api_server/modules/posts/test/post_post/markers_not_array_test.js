'use strict';

const ItemMarkerTest = require('./item_marker_test');

class MarkersNotArrayTest extends ItemMarkerTest {

	get description () {
		return 'should return an error when attempting to create a post and item with markers attribute that is not an array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: must be an array of objects'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// use a "numeric" markers structure ... not allowed!
		super.makePostData(() => {
			this.data.item.markers = 1;
			callback();
		});
	}
}

module.exports = MarkersNotArrayTest;
