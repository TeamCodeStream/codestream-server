// provide a module to handle requests associated with code "reviews"

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const ReviewCreator = require('./review_creator');
const ReviewUpdater = require('./review_updater');
const ReviewDeleter = require('./review_deleter');

const Review = require('./review');

// expose these restful routes
const REVIEW_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'put', 'delete'],
	baseRouteName: 'reviews',
	requestClasses: {
		'get': require('./get_review_request'),
		'getMany': require('./get_reviews_request'),
		'put': require('./put_review_request'),
		'delete': require('./delete_review_request')
	}
};

// additional routes for this module
const REVIEW_ADDITIONAL_ROUTES = [
	/*
	{
		method: 'put',
		path: 'reviews/follow/:id',
		requestClass: require('./follow_review_request')
	},
	{
		method: 'put',
		path: 'reviews/unfollow/:id',
		requestClass: require('./unfollow_review_request')
	},
	{
		method: 'get',
		path: 'no-auth/unfollow-link/:id',
		requestClass: require('./unfollow_link_request')
	}
	*/
];

class Reviews extends Restful {

	get collectionName () {
		return 'reviews';	// name of the data collection
	}

	get modelName () {
		return 'review';	// name of the data model
	}

	get creatorClass () {
		return ReviewCreator;	// use this class to instantiate reviews
	}

	get modelClass () {
		return Review;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single code review';
	}

	get updaterClass () {
		return ReviewUpdater;
	}

	get deleterClass () {
		return ReviewDeleter;
	}
	
	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(REVIEW_STANDARD_ROUTES);
		return [...standardRoutes, ...REVIEW_ADDITIONAL_ROUTES];
	}
}

module.exports = Reviews;
