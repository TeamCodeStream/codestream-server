'use strict';

var Get_Posts_By_Query_Test = require('./get_posts_by_query_test');

class Get_Posts_By_File_Test extends Get_Posts_By_Query_Test {

	get type () {
		return 'file';
	}

	get_query (posts) {
		return 'path=' + encodeURIComponent(posts[0].path);
	}
}

module.exports = Get_Posts_By_File_Test;
