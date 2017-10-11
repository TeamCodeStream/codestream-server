'use strict';

var Get_Posts_By_Commit_Test = require('./get_posts_by_commit_test');

class Get_Posts_Org_ID_Required_Test extends Get_Posts_By_Commit_Test {

	get description () {
		return 'should return an error if org_id is not provided in query';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1007',
			reason: 'org_id is required'
		};
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			this.path = '/posts?' + this.get_query(this.created_query_posts);	// ignoring org_id
			callback();
		});
	}
}

module.exports = Get_Posts_Org_ID_Required_Test;
