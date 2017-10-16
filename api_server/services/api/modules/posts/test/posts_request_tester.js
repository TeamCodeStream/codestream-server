'use strict';

var Aggregation = require(process.env.CI_API_TOP + '/lib/util/aggregation');
var Get_Post_Request_Tester = require('./get_post/get_post_request_tester');
var Get_Posts_Request_Tester = require('./get_posts/get_posts_request_tester');
var Post_Post_Request_Tester = require('./post_post/post_post_request_tester');

class Posts_Request_Tester extends Aggregation(
	Get_Post_Request_Tester,
	Get_Posts_Request_Tester,
	Post_Post_Request_Tester
) {
}

module.exports = Posts_Request_Tester;
