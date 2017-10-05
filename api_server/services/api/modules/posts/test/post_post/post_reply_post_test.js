'use strict';

var Assert = require('assert');
var Post_Post_Test = require('./post_post_test');

class Post_Reply_Post_Test extends Post_Post_Test {

	get type () {
		return 'reply';
	}

	validate_response (data) {
		super.validate_response(data);
		Assert(data.post.parent_post_id === this.data.parent_post_id, 'parent_post_id is not equal to the ID of the parent');
	}
}

module.exports = Post_Reply_Post_Test;
