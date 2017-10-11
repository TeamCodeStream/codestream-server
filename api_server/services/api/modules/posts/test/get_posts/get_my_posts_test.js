'use strict';

var Get_Posts_For_Two_Users_Test = require('./get_posts_for_two_users_test');

class Get_My_Posts_Test extends Get_Posts_For_Two_Users_Test {

	get description () {
		return 'should return the right posts when requesting posts by me';
	}

	prepare (callback) {
		this.path = '/posts?org_id=' + this.current_orgs[0]._id + '&mine';	// ignoring whatever else is in the query
		callback();
	}
}

module.exports = Get_My_Posts_Test;
