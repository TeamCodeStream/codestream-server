'use strict';

var Get_Posts_By_Query_Test = require('./get_posts_by_query_test');

class Get_Posts_By_Patch_Test extends Get_Posts_By_Query_Test {

	get type () {
		return 'patch';
	}

	get_query (posts) {
		return 'patch_id=' + encodeURIComponent(posts[0].patch_id);
	}
}

module.exports = Get_Posts_By_Patch_Test;
