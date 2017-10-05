'use strict';

var Get_Posts_By_Commit_Test = require('./get_posts_by_commit_test');

const DESCRIPTION = 'should return all the posts for an org if nothing else besides org_id is specified';

class Get_Posts_By_Org_Test extends Get_Posts_By_Commit_Test {

	get_description () {
		return DESCRIPTION;
	}

	get no_reply_posts () {
		return true;
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			this.path = '/posts?org_id=' + this.current_orgs[0]._id;	// ignoring whatever else is in the query
			// all the random posts we created for this org ... yeah, we expect those too
			Object.keys(this.created_random_posts).forEach(type => {
				this.created_query_posts = [...this.created_query_posts, ...this.created_random_posts[type]];
			});
			callback();
		});
	}
}

module.exports = Get_Posts_By_Org_Test;
