'use strict';

const PostItemTest = require('./post_item_test');

class NoAttributeTest extends PostItemTest {

	get description () {
		return `should return an error when attempting to create an item with no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// before the test runs...
	before (callback) {
		// delete the attribute when we try to create the item 
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
