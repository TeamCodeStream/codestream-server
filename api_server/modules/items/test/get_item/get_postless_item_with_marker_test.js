'use strict';

const GetPostlessItemTest = require('./get_postless_item_test');
const ItemTestConstants = require('../item_test_constants');

class GetPostlessItemWithMarkerTest extends GetPostlessItemTest {

	get description () {
		return 'should return the item with markers when requesting a postless item with markers created for a third-party provider';
	}

	// make the data for the item to be created for the test
	makeItemData () {
		const data = super.makeItemData();
		data.markers = this.markerFactory.createRandomMarkers(1, { withRandomStream: true });
		return data;
	}

	// validate the request response
	validateResponse (data) {
		// validate we got a marker, and that we only got sanitized attributes
		const item = data.item;
		const marker = data.markers[0];
		this.validateMatchingObject(item.markerIds[0], marker, 'marker');
		this.validateSanitized(marker, ItemTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = GetPostlessItemWithMarkerTest;
