'use strict';

const DeletePostTest = require('./delete_post_test');

class MarkerDeletedTest extends DeletePostTest {

	get description () {
		return 'should delete associated markers when a post is deleted';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantMarker = true;
			callback();
		});
	}
}

module.exports = MarkerDeletedTest;
