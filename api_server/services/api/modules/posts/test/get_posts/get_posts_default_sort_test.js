'use strict';

var Get_Channel_Posts_Test = require('./get_posts_test');

class Get_Posts_Default_Sort_Test extends Get_Channel_Posts_Test {

	get description () {
		return 'should return the correct posts in descending order when requesting posts in default sort order';
	}

	set_path (callback) {
		this.my_posts.reverse();
		this.path = `/posts/?stream_id=${this.stream._id}`;
		callback();
	}

	validate_response (data) {
		this.validate_sorted_matching_objects(data.posts, this.my_posts, 'posts');
		super.validate_response(data);
	}
}

module.exports = Get_Posts_Default_Sort_Test;
