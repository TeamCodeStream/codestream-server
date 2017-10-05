'use strict';

var Get_Posts_By_Query_Test = require('./get_posts_by_query_test');

class Get_Posts_By_Group_Test extends Get_Posts_By_Query_Test {

	get type () {
		return 'group';
	}

	get_query (posts) {
		return 'group_id=' + encodeURIComponent(posts[0].group_id);
	}
}

module.exports = Get_Posts_By_Group_Test;
