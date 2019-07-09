'use strict';

const PostCodemarkTest = require('./post_codemark_test');

class EmptyPostIdTest extends PostCodemarkTest {

	get description () {
		return 'should be ok to create a codemark without a post ID if there is also no stream ID';
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
