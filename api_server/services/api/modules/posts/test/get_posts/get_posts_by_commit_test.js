'use strict';

var Get_Posts_By_Query_Test = require('./get_posts_by_query_test');

class Get_Posts_By_Commit_Test extends Get_Posts_By_Query_Test {

	get type () {
		return 'commit';
	}

	get_query (posts) {
		return 'commit_id=' + encodeURIComponent(posts[0].commit_id);
	}
}

module.exports = Get_Posts_By_Commit_Test;
