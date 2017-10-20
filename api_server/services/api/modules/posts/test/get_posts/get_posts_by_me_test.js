'use strict';

var Get_Channel_Posts_Test = require('./get_posts_test');

class Get_Posts_By_Me_Test extends Get_Channel_Posts_Test {

	get description () {
		return 'should return the correct posts when requesting posts in a stream authored by me';
	}

	set_path (callback) {
		this.my_posts = this.my_posts.filter(post => post.creator_id === this.current_user._id);
		this.path = `/posts/?stream_id=${this.stream._id}&mine`;
		callback();
	}
}

module.exports = Get_Posts_By_Me_Test;
