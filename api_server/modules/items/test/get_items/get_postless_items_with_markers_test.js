'use strict';

const GetPostlessItemsTest = require('./get_postless_items_test');

class GetPostlessItemsWithMarkersTest extends GetPostlessItemsTest {

	constructor (options) {
		super(options);
		this.wantMarker = true;
		this.repoOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return the correct items with markers when requesting items for a team that were created with associated markers for a team and the items are for third-party provider';
	}
}

module.exports = GetPostlessItemsWithMarkersTest;
