'use strict';

var Get_Posts_By_Query_Test = require('./get_posts_by_query_test');

class Get_Posts_By_Parent_Test extends Get_Posts_By_Query_Test {

	get type () {
		return 'reply';
	}

	get_query (posts) {
		return 'parent_post_id=' + encodeURIComponent(posts[0].parent_post_id);
	}
}

module.exports = Get_Posts_By_Parent_Test;
