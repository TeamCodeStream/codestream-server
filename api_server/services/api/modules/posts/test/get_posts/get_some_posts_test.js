'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');

const DESCRIPTION = 'should return the right posts when requesting posts by IDs';

class Get_Some_Posts_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION;
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_posts,
			this.prepare
		], callback);
	}

	create_posts (callback) {
		this.created_posts = [];
		Bound_Async.timesSeries(
			this,
			5,
			this.create_post,
			callback
		);
	}

	create_post (n, callback) {
		this.post_factory.create_random_post(
			(error, post) => {
				if (error) { return callback(error); }
				this.created_posts.push(post);
				callback();
			},
			{
				token: this.token,
				org: this.current_orgs[0]
			}
		);
	}

	prepare (callback) {
		this.post_subset = [
			this.created_posts[1],
			this.created_posts[3],
			this.created_posts[4]
		];
		var ids_subset = this.post_subset.map(post => post._id);
		this.path = '/posts?ids=' + ids_subset.join(',');
		callback();
	}

	validate_response (data) {
		this.validate_matching_objects(this.post_subset, data.posts, 'posts');
	}
}

module.exports = Get_Some_Posts_Test;
