'use strict';

var PostPostTest = require('./post_post_test');

class PostToChannelTest extends PostPostTest {

	constructor (options) {
		super(options);
		this.streamType = 'channel';
	}

	get description () {
		return 'should return a valid post when creating a post in a channel stream';
	}
}

module.exports = PostToChannelTest;
