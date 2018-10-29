'use strict';

const GetPostlessItemsTest = require('./get_postless_items_test');
const Assert = require('assert');

class GetPostlessItemsWithMarkersTest extends GetPostlessItemsTest {

	constructor (options) {
		super(options);
		this.wantCodeBlock = true;
	}

	get description () {
		return 'should return the correct items with markers when requesting items for a team that were created with associated code blocks for a team and the items are for third-party provider';
	}

	// validate correct response
	validateResponse (data) {
		data.items.forEach(item => {
			Assert.deepEqual(item.markerIds, [item.markers[0]._id], 'item does not have correct markers for its markerIds');
		});
		super.validateResponse(data);
	}
}

module.exports = GetPostlessItemsWithMarkersTest;
