'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');

class Get_Posts_By_Query_Test extends CodeStream_API_Test {

	get description () {
		return 'should return the right posts when requesting posts by ' + this.type;
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_query_posts,
			this.create_random_posts,
			this.prepare
		], callback);
	}

	create_query_posts (callback) {
		this.post_factory.create_n_same_of_type(
			5,
			this.type,
			(error, posts) => {
				if (error) { return callback(error); }
				this.created_query_posts = posts[this.type];
				callback();
			},
			{
				org: this.current_orgs[0],
				token: this.token
			}
		);
	}

	create_random_posts (callback) {
		this.post_factory.create_n_of_each_type(
	 		5,
	 		(error, posts) => {
	 			if (error) { return callback(error); }
	 			this.created_random_posts = posts;
	 			callback();
	 		},
	 		{
	 			org: this.current_orgs[0],
	 			token: this.token,
	 			no_reply: this.no_reply_posts
	 		}
	 	);
	}

	prepare (callback) {
		this.path = '/posts?org_id=' + this.current_orgs[0]._id;
		let query = this.get_query(this.created_query_posts);
		if (query) {
			this.path += '&' + query;
		}
		callback();
	}

	get_query () {
		return null;
	}

	validate_response (data) {
		this.validate_matching_objects(this.created_query_posts, data.posts, 'posts');
	}
}

module.exports = Get_Posts_By_Query_Test;
