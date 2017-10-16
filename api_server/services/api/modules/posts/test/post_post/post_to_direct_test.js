'use strict';

var Post_Post_Test = require('./post_post_test');

class Post_To_Direct_Test extends Post_Post_Test {

	get description () {
		return 'should return a valid post when creating a post in a direct stream';
	}

	make_stream_options (callback) {
		super.make_stream_options(() => {
			this.stream_options.member_ids = [this.users[1]._id];
			callback();
		});
	}
}

module.exports = Post_To_Direct_Test;
