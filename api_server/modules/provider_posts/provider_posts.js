// provide a module to handle requests associated with provider posts

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const ProviderPostCreator = require('./provider_post_creator');
const ProviderPost = require('./provider_post');

// expose these restful routes
const PROVIDER_POST_STANDARD_ROUTES = {
	want: ['post'],
	baseRouteName: 'provider-posts/:provider',
	requestClasses: {
		'post': require('./provider_post_request')
	}
};

// additional routes for this module
const PROVIDER_POST_ADDITIONAL_ROUTES = [
	// DEPRECATE ME ... this is to just to prevent a 404 until 
	// extenion that calls /provider-posts is released
	{
		method: 'post',
		path: 'slack-posts',
		requestClass: require('./slack_post_request')
	}
];

class ProviderPosts extends Restful {

	get collectionName () {
		return 'providerPosts';	// name of the data collection
	}

	get modelName () {
		return 'providerPost';	// name of the data model
	}

	get creatorClass () {
		return ProviderPostCreator;	// use this class to instantiate posts
	}

	get modelClass () {
		return ProviderPost;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single provider post';
	}

	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(PROVIDER_POST_STANDARD_ROUTES);
		return [...standardRoutes, ...PROVIDER_POST_ADDITIONAL_ROUTES];
	}
}

module.exports = ProviderPosts;
