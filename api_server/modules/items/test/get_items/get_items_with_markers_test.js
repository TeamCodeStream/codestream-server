'use strict';

const GetItemsTest = require('./get_items_test');

class GetItemsWithMarkersTest extends GetItemsTest {

	constructor (options) {
		super(options);
		this.postOptions.wantMarker = true;
	}

	get description () {
		return 'should return the correct items with markers when requesting items for a team that were created with associated markers';
	}
}

module.exports = GetItemsWithMarkersTest;
