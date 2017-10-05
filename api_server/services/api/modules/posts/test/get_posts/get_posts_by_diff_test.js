'use strict';

var Get_Posts_By_Query_Test = require('./get_posts_by_query_test');

class Get_Posts_By_Diff_Test extends Get_Posts_By_Query_Test {

	get type () {
		return 'diff';
	}

	get_query (posts) {
		return 'diff_id=' + encodeURIComponent(posts[0].diff_id);
	}
}

module.exports = Get_Posts_By_Diff_Test;
