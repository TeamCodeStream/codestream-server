'use strict';

const ItemTest = require('./item_test');

class NoItemTypeTest extends ItemTest {

	get description () {
		return 'should return error when attempting to create a post with an item with no type';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'type'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the type attribute when we try to create the item with the post
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.item.type;
			callback();
		});
	}
}

module.exports = NoItemTypeTest;
