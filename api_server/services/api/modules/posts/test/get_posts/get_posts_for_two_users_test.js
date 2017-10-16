'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Get_Posts_By_Org_Test = require('./get_posts_by_org_test');

class Get_Posts_For_Two_Users_Test extends Get_Posts_By_Org_Test {

	before (callback) {
		Bound_Async.series(this, [
			this.create_another_user,
			this.create_posts_for_other_user,
			super.before,
			this.prepare
		], callback);
	}

	create_another_user (callback) {
		this.user_factory.create_random_user(
			(error, data) => {
				if (error) { return callback(error); }
				this.other_user_data = data;
				callback();
			},
			{
				company_name: this.current_orgs[0].git_owner
			}
		);
	}

	create_posts_for_other_user (callback) {
		this.post_factory.create_n_of_each_type(
	 		5,
	 		(error, posts) => {
	 			if (error) { return callback(error); }
	 			this.created_random_posts_by_other_user = posts;
	 			callback();
	 		},
	 		{
	 			org: this.other_user_data.orgs[0],
	 			token: this.other_user_data.access_token,
	 			no_reply: this.no_reply_posts
	 		}
	 	);
	}
}

module.exports = Get_Posts_For_Two_Users_Test;
