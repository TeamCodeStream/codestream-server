'use strict';

const ItemMarkerTest = require('./item_marker_test');

class NoLocationOkTest extends ItemMarkerTest {

	get description () {
		return 'should accept the post and item and return them when no location is given with a marker';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// completely remove the location, this is permitted
		super.makePostData(() => {
			delete this.data.item.markers[0].location;
			callback();
		});
	}
}

module.exports = NoLocationOkTest;
