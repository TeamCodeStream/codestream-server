'use strict';

var Get_Channel_Posts_Test = require('./get_posts_test');

class Get_Child_Posts_Test extends Get_Channel_Posts_Test {

	constructor (options) {
		super(options);
		this.num_posts = 10;
		this.which_post_to_reply_to = 2;
	}

	get description () {
		return 'should return the correct posts when requesting the child posts of a parent';
	}

	set_post_options (n) {
		let post_options = super.set_post_options(n);
		if (n > this.which_post_to_reply_to && n % 3 === 0) {
			delete post_options.want_location;
			post_options.parent_post_id = this.my_posts[this.which_post_to_reply_to]._id;
		}
		return post_options;
	}

	set_path (callback) {
		let parent_post_id = this.my_posts[this.which_post_to_reply_to]._id;
		this.my_posts = this.my_posts.filter(post => post.parent_post_id === parent_post_id);
		this.path = `/posts/?stream_id=${this.stream._id}&parent_post_id=${parent_post_id}`;
		callback();
	}
}

module.exports = Get_Child_Posts_Test;
