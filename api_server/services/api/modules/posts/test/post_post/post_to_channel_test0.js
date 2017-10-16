'use strict';

var Post_Post_Test = require('./post_post_test');

class Post_To_Channel_Test extends Post_Post_Test {

	constructor (options) {
		super(options);
		this.stream_type = 'channel';
	}

	get description () {
		return 'should return a valid post when creating a post in a channel stream';
	}
}

module.exports = Post_To_Channel_Test;
