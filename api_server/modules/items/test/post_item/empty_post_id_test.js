'use strict';

const PostItemTest = require('./post_item_test');

class EmptyPostIdTest extends PostItemTest {

	get description () {
		return 'should be ok to create an item without a post ID if there is also no stream ID';
	}

	// before the test runs...
	before (callback) {
		// delete the postId and streamId attributes 
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.postId;
			delete this.data.streamId;
			callback();
		});
	}
}

module.exports = EmptyPostIdTest;
