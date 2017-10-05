'use strict';

var Assert = require('assert');
var Post_Post_Test = require('./post_post_test');

class Post_Group_Post_Test extends Post_Post_Test {

	get type () {
		return 'group';
	}

	validate_response (data) {
		super.validate_response(data);
		Assert(data.post.group_id === this.data.group_id, 'group_id is not equal to the ID of the group for which the post was created');
	}
}

module.exports = Post_Group_Post_Test;
