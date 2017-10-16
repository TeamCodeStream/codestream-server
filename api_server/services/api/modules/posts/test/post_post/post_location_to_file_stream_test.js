'use strict';

var Post_To_File_Stream_Test = require('./post_to_file_stream_test');
var Assert = require('assert');

class Post_Location_To_File_Stream_Test extends Post_To_File_Stream_Test {

	get description () {
		return 'should return a valid post when creating a post with location info in a file stream';
	}

	make_post_options (callback) {
		super.make_post_options(() => {
			this.post_options.want_location = true;
			callback();
		});
	}

	validate_response (data) {
		let post = data.post;
		Assert.deepEqual(post.location, this.data.location, 'location does not match');
		Assert.deepEqual(post.replay_info, this.data.replay_info, 'replay_info does not match');
		super.validate_response(data);
	}
}

module.exports = Post_Location_To_File_Stream_Test;
