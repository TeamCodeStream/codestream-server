'use strict';

const GetItemsTest = require('./get_items_test');
const Assert = require('assert');

class GetItemsWithMarkersTest extends GetItemsTest {

	constructor (options) {
		super(options);
		this.postOptions.wantCodeBlock = true;
	}

	get description () {
		return 'should return the correct items with markers when requesting items for a team that were created with associated code blocks';
	}

	// validate correct response
	validateResponse (data) {
		data.items.forEach(item => {
			Assert.deepEqual(item.markerIds, [item.markers[0]._id], 'item does not have correct markers for its markerIds');
		});
		super.validateResponse(data);
	}
}

module.exports = GetItemsWithMarkersTest;
