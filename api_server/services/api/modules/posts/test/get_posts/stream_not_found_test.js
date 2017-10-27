'use strict';

var Get_Posts_Test = require('./get_posts_test');
var ObjectID = require('mongodb').ObjectID;

class Stream_Not_Found_Test extends Get_Posts_Test {

	get description () {
		return 'should return an error when trying to fetch posts from a stream that doesn\'t exist';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	set_path (callback) {
		let stream_id = ObjectID();
		this.path = `/posts?team_id=${this.team._id}&stream_id=${stream_id}`;
		callback();
	}
}

module.exports = Stream_Not_Found_Test;
