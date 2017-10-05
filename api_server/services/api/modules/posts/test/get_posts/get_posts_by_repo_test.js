'use strict';

var Get_Posts_By_Query_Test = require('./get_posts_by_query_test');

class Get_Posts_By_Repo_Test extends Get_Posts_By_Query_Test {

	get type () {
		return 'repo';
	}

	get_query (posts) {
		return 'repo=' + encodeURIComponent(posts[0].repo);
	}
}

module.exports = Get_Posts_By_Repo_Test;
