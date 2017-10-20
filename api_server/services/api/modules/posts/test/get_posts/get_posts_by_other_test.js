'use strict';

var Get_Channel_Posts_Test = require('./get_posts_test');

class Get_Posts_By_Other_Test extends Get_Channel_Posts_Test {

	get description () {
		return 'should return the correct posts when requesting posts in a stream authored by another user';
	}

	set_path (callback) {
		let user_id = this.other_user_data.user._id;
		this.my_posts = this.my_posts.filter(post => post.creator_id === user_id);
		this.path = `/posts/?stream_id=${this.stream._id}&creator_id=${user_id}`;
		callback();
	}
}

module.exports = Get_Posts_By_Other_Test;
