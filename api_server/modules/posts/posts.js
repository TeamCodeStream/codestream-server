// provide a module to handle requests associated with posts

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const PostCreator = require('./post_creator');
const PostUpdater = require('./post_updater');
const PostDeleter = require('./post_deleter');
const Post = require('./post');
const UUID = require('uuid/v4');
const EmailNotificationRequest = require('./email_notification_request');

const DEPENDENCIES = [
	'aws'	// the posts module creates a queue
];

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

	getDependencies () {
		return DEPENDENCIES; // other modules to be serviced first
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

	get updaterClass () {
		return PostUpdater;	// use this class to update posts
	}

	get deleterClass () {
		return PostDeleter;	// use this class to delete (deactivate) posts
	}

	getRoutes () {
		return super.getRoutes(POST_STANDARD_ROUTES);
	}

	// initialize the module
	async initialize () {
		// create a queue for handling messages concerning triggering the interval
		// timer for email notifications
		if (!this.api.services.queueService) { return; }
		await this.api.services.queueService.createQueue({
			name: this.api.config.aws.sqs.outboundEmailQueueName,
			handler: this.handleEmailNotificationMessage.bind(this),
			logger: this.api
		});
	}

	// handle an incoming message on the email notifications interval timer queue
	// we'll treat this like an incoming request for logging purposes, but it
	// isn't a real request
	async handleEmailNotificationMessage (message, releaseCallback) {
		const request = { id: UUID() };
		this.api.services.requestTracker.trackRequest(request);
		releaseCallback(true); // this releases the message from the queue
		await new EmailNotificationRequest({
			api: this.api,
			request: request,
			message: message
		}).fulfill();
		this.api.services.requestTracker.untrackRequest(request);
	}
}

module.exports = Posts;
