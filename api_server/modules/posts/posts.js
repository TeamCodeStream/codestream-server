// provide a module to handle requests associated with posts

'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var PostCreator = require('./post_creator');
var PostUpdater = require('./post_updater');
var PostDeleter = require('./post_deleter');
var Post = require('./post');

// expose these restful routes
const POST_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post', 'put', 'delete'],
	baseRouteName: 'posts',
	requestClasses: {
		'getMany': require('./get_posts_request'),
		'post': require('./post_post_request'),
		'put': require('./put_post_request'),
		'delete': require('./delete_post_request')
	}
};

class Posts extends Restful {

	get collectionName () {
		return 'posts';	// name of the data collection
	}

	get modelName () {
		return 'post';	// name of the data model
	}

	get creatorClass () {
		return PostCreator;	// use this class to instantiate posts
	}

	get modelClass () {
		return Post;	// use this class for the data model
	}

	get updaterClass () {
		return PostUpdater;	// use this class to update posts
	}

	get deleterClass () {
		return PostDeleter;	// use this class to delete (deactivate) posts
	}
	
	getRoutes () {
		return super.getRoutes(POST_STANDARD_ROUTES);
	}
}

module.exports = Posts;
