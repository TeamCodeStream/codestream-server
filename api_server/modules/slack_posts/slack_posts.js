// provide a module to handle requests associated with slack posts

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const SlackPostCreator = require('./slack_post_creator');
const SlackPost = require('./slack_post');

// expose these restful routes
const SLACK_POST_STANDARD_ROUTES = {
	want: ['post'],
	baseRouteName: 'slack-posts',
	requestClasses: {
		'post': require('./post_slack_post_request')
	}
};

class SlackPosts extends Restful {

	get collectionName () {
		return 'slackPosts';	// name of the data collection
	}

	get modelName () {
		return 'slackPost';	// name of the data model
	}

	get creatorClass () {
		return SlackPostCreator;	// use this class to instantiate posts
	}

	get modelClass () {
		return SlackPost;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single slack post';
	}

	// get all routes exposed by this module
	getRoutes () {
		return super.getRoutes(SLACK_POST_STANDARD_ROUTES);
	}
}

module.exports = SlackPosts;
