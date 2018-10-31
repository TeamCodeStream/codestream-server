'use strict';

const GetItemsTest = require('./get_items_test');
const Assert = require('assert');

class GetItemsByTypeTest extends GetItemsTest {

	get description () {
		return 'should return the correct items when requesting items for a team and by type';
	}

	setPath (callback) {
		this.type = this.postOptions.itemTypes[1];
		this.expectedItems = this.items.filter(item => item.type === this.type);
		this.path = `/items?teamId=${this.team._id}&type=${this.type}`;
		callback();
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
