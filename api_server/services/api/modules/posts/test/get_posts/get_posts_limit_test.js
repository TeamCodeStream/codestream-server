'use strict';

var Get_Channel_Posts_Test = require('./get_posts_test');

class Get_Posts_Limit_Test extends Get_Channel_Posts_Test {

	constructor (options) {
		super(options);
		this.num_posts = 10;
	}

	get description () {
		return 'should return the correct posts when requesting a limited number of posts';
	}

	set_path (callback) {
		this.my_posts.splice(0, this.num_posts - 3);
		this.path = `/posts/?stream_id=${this.stream._id}&limit=3`;
		callback();
	}
}

module.exports = Get_Posts_Limit_Test;
