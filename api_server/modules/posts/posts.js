'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var PostCreator = require('./post_creator');
var Post = require('./post');

const POST_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post'],
	baseRouteName: 'posts',
	requestClasses: {
		'getMany': require('./get_posts_request'),
		'post': require('./post_post_request')
	}
};

class Posts extends Restful {

	get collectionName () {
		return 'posts';
	}

	get modelName () {
		return 'post';
	}

	get creatorClass () {
		return PostCreator;
	}

	get modelClass () {
		return Post;
	}

/*
	get updaterClass () {
		return PostUpdater;
	}
*/

	getRoutes () {
		return super.getRoutes(POST_STANDARD_ROUTES);
	}
}

module.exports = Posts;
