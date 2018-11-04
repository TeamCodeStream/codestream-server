'use strict';

const ItemMarkerTest = require('./item_marker_test');

class MarkerTooBigTest extends ItemMarkerTest {

	get description () {
		return 'should return an error when attempting to create a post and item with a marker element that is too big';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: object at [0-9]+ is too long'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// put a whole bunch of code in the marker, greater than the limit
		super.makePostData(() => {
			this.data.item.markers[0].code = 'x'.repeat(10001);
			callback();
		});
	}
}

module.exports = MarkerTooBigTest;
