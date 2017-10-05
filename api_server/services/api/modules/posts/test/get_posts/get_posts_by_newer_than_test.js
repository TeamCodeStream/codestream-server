'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');

const DESCRIPTION = 'should return the right posts when requesting posts newer than a time';

class Get_Posts_By_Newer_Than_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION;
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_before_posts,
			this.create_after_posts,
			this.prepare
		], callback);
	}

	create_before_posts (callback) {
		this.create_random_posts('before', callback);
	}

	create_after_posts (callback) {
		this.time_mark = Date.now();
		this.create_random_posts('after', callback);
	}

	create_random_posts (for_when, callback) {
		this.post_factory.create_n_of_each_type(
	 		5,
	 		(error, posts) => {
	 			if (error) { return callback(error); }
	 			var which = for_when + '_posts';
	 			this[which] = [];
	 			Object.keys(posts).forEach(type => {
					this[which] = [...this[which], ...posts[type]];
				});
	 			callback();
	 		},
	 		{
	 			org: this.current_orgs[0],
	 			token: this.token,
	 			no_reply: true
	 		}
	 	);
	}

	prepare (callback) {
		this.path = '/posts?org_id=' + this.current_orgs[0]._id + '&newer_than=' + this.time_mark;
		callback();
	}

	validate_response (data) {
		this.validate_matching_objects(this.after_posts, data.posts, 'posts');
	}
}

module.exports = Get_Posts_By_Newer_Than_Test;
