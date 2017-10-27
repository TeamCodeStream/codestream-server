'use strict';

var Get_Posts_Test = require('./get_posts_test');

class Get_Posts_Newer_Than_Test extends Get_Posts_Test {

	get description () {
		return 'should return the correct posts when requesting posts in a stream edited more recently than some timestamp';
	}

	set_path (callback) {
		let pivot = this.my_posts[2].modified_at;
		this.my_posts = this.my_posts.filter(post => post.modified_at > pivot);
		this.path = `/posts/?team_id=${this.team._id}&stream_id=${this.stream._id}&newer_than=${pivot}`;
		callback();
	}
}

module.exports = Get_Posts_Newer_Than_Test;
