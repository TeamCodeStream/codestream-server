'use strict';

const MarkerTest = require('./marker_test');
const ItemTest = require('./item_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ItemMarkerTest extends MarkerTest {

	get description () {
		return 'should return the post with item info and marker info when creating a post with item info and a marker';
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			ItemTest.prototype.addItemData.bind(this)
		], callback);
	}

	// validate the response to the post request
	validateResponse (data) {
		// validate that we got an item in the response
		ItemTest.prototype.validateItems.call(this, data);
		super.validateResponse(data);
	}
}

module.exports = ItemMarkerTest;
