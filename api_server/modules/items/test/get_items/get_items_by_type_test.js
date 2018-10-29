'use strict';

const GetItemsTest = require('./get_items_test');
const Assert = require('assert');

class GetItemsByTypeTest extends GetItemsTest {

	get description () {
		return 'should return the correct items when requesting items for a team and by type';
	}

	// get the query parameters to use for the request
	getQueryParameters () {
		this.type = this.postOptions.itemTypes[1];
		this.items = this.items.filter(item => item.type === this.type);
		return {
			teamId: this.team._id,
			type: this.type
		};
	}

	// validate correct response
	validateResponse (data) {
		data.items.forEach(item => {
			Assert.equal(item.type, this.type, 'got an item with non-matching type');
		});
		super.validateResponse(data);
	}
}

module.exports = GetItemsByTypeTest;
