'use strict';

const PostPostTest = require('./post_post_test');

class PostToChannelTest extends PostPostTest {

	constructor (/*options*/) {
		throw 'this test is deprecated';
	}
	
	get description () {
		return 'should return a valid post when creating a post in a channel stream';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.type = 'channel';
			callback();
		});
	}
}

module.exports = PostToChannelTest;
