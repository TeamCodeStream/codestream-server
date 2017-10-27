'use strict';

var Get_Posts_Test = require('./get_posts_test');

class Get_Posts_By_Id_Test extends Get_Posts_Test {

	get description () {
		return 'should return the correct posts when requesting posts by ID';
	}

	set_path (callback) {
		this.my_posts = [
			this.my_posts[0],
			this.my_posts[2],
			this.my_posts[3]
		];
		let ids = this.my_posts.map(post => post._id);
		this.path = `/posts?team_id=${this.team._id}&stream_id=${this.stream._id}&ids=${ids}`;
		callback();
	}
}

module.exports = Get_Posts_By_Id_Test;
