'use strict';

const PostPostTest = require('./post_post_test');

class PostToDirectTest extends PostPostTest {

	constructor (/*options*/) {
		throw 'this test is deprecated';
	}

	get description () {
		return 'should return a valid post when creating a post in a direct stream';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.type = 'direct';
			callback();
		});
	}
}

module.exports = PostToDirectTest;
