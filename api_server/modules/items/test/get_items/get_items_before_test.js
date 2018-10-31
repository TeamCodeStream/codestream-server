'use strict';

const GetItemsTest = require('./get_items_test');

class GetItemsBeforeTest extends GetItemsTest {

	get description () {
		return 'should return the correct items when requesting items in a stream before a timestamp';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected items based on that pivot,
		// and specify the before parameter to fetch based on the pivot
		const pivot = this.items[5].createdAt;
		this.expectedItems = this.items.filter(item => item.createdAt < pivot);
		this.path = `/items?teamId=${this.team._id}&before=${pivot}`;
		callback();
	}
}

module.exports = GetItemsBeforeTest;
