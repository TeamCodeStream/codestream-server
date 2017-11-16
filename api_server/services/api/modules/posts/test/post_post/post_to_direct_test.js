'use strict';

var PostPostTest = require('./post_post_test');

class PostToDirectTest extends PostPostTest {

	get description () {
		return 'should return a valid post when creating a post in a direct stream';
	}

	makeStreamOptions (callback) {
		super.makeStreamOptions(() => {
			this.streamOptions.memberIds = [this.users[1]._id];
			callback();
		});
	}
}

module.exports = PostToDirectTest;
