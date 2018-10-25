'use strict';

const PostMarkerTest = require('./post_marker_test');

class NoPostIdTest extends PostMarkerTest {

	get description () {
		return 'can create a marker without a post ID';
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// remove the given attribute
		super.makeMarkerData(() => {
			this.noPostId = true;
			delete this.data.postId;
			callback();
		});
	}
}

module.exports = NoPostIdTest;
