// provide a module to handle requests associated with posts

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const PostCreator = require('./post_creator');
const PostUpdater = require('./post_updater');
const PostDeleter = require('./post_deleter');
const Post = require('./post');
const { callbackWrap } = require(process.env.CS_API_TOP + '/server_utils/await_utils');
const Errors = require('./errors');

const DEPENDENCIES = [
	'aws'
];

// expose these restful routes
const POST_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post', 'put', 'delete'],
	baseRouteName: 'posts',
	requestClasses: {
		'get': require('./get_post_request'),
		'getMany': require('./get_posts_request'),
		'post': require('./post_post_request'),
		'put': require('./put_post_request'),
		'delete': require('./delete_post_request')
	}
};

// additional routes for this module
const POST_ADDITIONAL_ROUTES = [
	{
		method: 'put',
		path: 'react/:id',
		requestClass: require('./react_request')
	}
];

class Posts extends Restful {

	getDependencies () {
		return DEPENDENCIES;
	}
	
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

	get modelDescription () {
		return 'A single post in a stream';
	}

	get updaterClass () {
		return PostUpdater;	// use this class to update posts
	}

	get deleterClass () {
		return PostDeleter;	// use this class to delete (deactivate) posts
	}

	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(POST_STANDARD_ROUTES);
		return [...standardRoutes, ...POST_ADDITIONAL_ROUTES];
	}

	// initialize the module
	async initialize () {
		// create a queue for handling messages concerning triggering the interval
		// timer for email notifications
		if (!this.api.services.queueService) { return; }
		if (!this.api.config.aws.sqs.outboundEmailQueueName) { return; }
		await callbackWrap(
			this.api.services.queueService.createQueue.bind(this.api.services.queueService),
			{
				name: this.api.config.aws.sqs.outboundEmailQueueName,
				logger: this.api
			}
		);
	}

	describeErrors () {
		return {
			'Posts': Errors
		};
	}
}

module.exports = Posts;
