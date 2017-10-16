'use strict';

var Post_To_File_Stream_Test = require('./post_to_file_stream_test');
var Assert = require('assert');

class Post_Reply_Test extends Post_To_File_Stream_Test {

	constructor (options) {
		super(options);
		this.test_options.want_other_post = true;
	}

	get description () {
		return 'should return a valid post when creating a reply post in a file stream';
	}

	create_other_post (callback) {
		this.post_options.want_location = true;
		super.create_other_post(callback);
	}

	make_post_data (callback) {
		delete this.post_options.want_location;
		this.post_options.parent_post_id = this.other_post_data.post._id;
		super.make_post_data(callback);
	}

	validate_response (data) {
		let post = data.post;
		Assert(post.parent_post_id === this.data.parent_post_id, 'parent_post_id does not match the ID of the parent post');
		super.validate_response(data);
	}
}

module.exports = Post_Reply_Test;
