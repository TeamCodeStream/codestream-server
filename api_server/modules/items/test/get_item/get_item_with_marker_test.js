'use strict';

const GetItemTest = require('./get_item_test');
const ItemTestConstants = require('../item_test_constants');

class GetItemWithMarkerTest extends GetItemTest {

	constructor (options) {
		super(options);
		this.postOptions.wantCodeBlock = true;
	}

	get description () {
		return 'should return the item with markers when requesting an item with code blocks';
	}

	// validate the request response
	validateResponse (data) {
		// validate we got a marker, and that we only got sanitized attributes
		const item = data.item;
		const marker = item.markers[0];
		this.validateMatchingObject(item.markerIds[0], marker, 'marker');
		this.validateSanitized(marker, ItemTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = GetItemWithMarkerTest;
