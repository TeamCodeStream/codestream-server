'use strict';

var Get_Posts_For_Two_Users_Test = require('./get_posts_for_two_users_test');

class Get_Posts_By_Creator_Test extends Get_Posts_For_Two_Users_Test {

	get description () {
		return 'should return the right posts when requesting posts by creator';
	}

	prepare (callback) {
		// all the random posts we created for the other user, this is what we expect
		this.created_query_posts = [];
		Object.keys(this.created_random_posts_by_other_user).forEach(type => {
			this.created_query_posts = [...this.created_query_posts, ...this.created_random_posts_by_other_user[type]];
		});
		this.path = '/posts?org_id=' + this.current_orgs[0]._id + '&creator_id=' + this.other_user_data.user._id;	// ignoring whatever else is in the query
		callback();
	}
}

module.exports = Get_Posts_By_Creator_Test;
