'use strict';

var Get_Channel_Posts_Test = require('./get_posts_test');
var ObjectID = require('mongodb').ObjectID;

class Get_Posts_Less_Than_Equal_Test extends Get_Channel_Posts_Test {

	get description () {
		return 'should return the correct posts when requesting posts in a stream with IDs less than or equal to some value';
	}

	set_path (callback) {
		let pivot = this.my_posts[2]._id;
		this.my_posts = this.my_posts.filter(post => ObjectID(post._id) <= ObjectID(pivot));
		this.path = `/posts/?stream_id=${this.stream._id}&lte=${pivot}`;
		callback();
	}
}

module.exports = Get_Posts_Less_Than_Equal_Test;
