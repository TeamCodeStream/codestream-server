'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var Post_Creator = require('./post_creator');
var Post = require('./post');

const POST_STANDARD_ROUTES = {
	want: ['get', 'get_many', 'post'],
	base_route_name: 'posts',
	request_classes: {
		'get_many': require('./get_posts_request')
	}
};

class Posts extends Restful {

	get collection_name () {
		return 'posts';
	}

	get model_name () {
		return 'post';
	}

	get creator_class () {
		return Post_Creator;
	}

	get model_class () {
		return Post;
	}

/*
	get updater_class () {
		return Post_Updater;
	}
*/

	get_routes () {
		return super.get_routes(POST_STANDARD_ROUTES);
	}
}

module.exports = Posts;
