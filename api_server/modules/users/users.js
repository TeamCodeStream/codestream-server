// provide a module to handle requests associated with users

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const UserCreator = require('./user_creator');
const UserUpdater = require('./user_updater');
const User = require('./user');
const Errors = require('./errors');

// expose these restful routes
const USERS_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'put', 'post'],
	baseRouteName: 'users',
	requestClasses: {
		'get': require('./get_user_request'),
		'getMany': require('./get_users_request'),
		'put': require('./put_user_request'),
		'post': require('./post_user_request')
	}
};

// additional routes for this module
const USERS_ADDITIONAL_ROUTES = [
	{
		method: 'post',
		path: 'no-auth/register',
		requestClass: require('./register_request')
	},
	{
		method: 'post',
		path: 'no-auth/confirm',
		requestClass: require('./confirm_request')
	},
	{
		method: 'put',
		path: 'no-auth/login',
		requestClass: require('./login_request')
	},
	{
		method: 'put',
		path: 'read/:streamId',
		requestClass: require('./read_request')
	},
	{
		method: 'get',
		path: 'preferences',
		requestClass: require('./get_preferences_request')
	},
	{
		method: 'put',
		path: 'preferences',
		requestClass: require('./put_preferences_request')
	},
	{
		method: 'put',
		path: 'grant/:channel',
		requestClass: require('./grant_request')
	},
	{
		method: 'put',
		path: 'presence',
		requestClass: require('./presence_request')
	},
	{
		method: 'get',
		path: 'sessions',
		requestClass: require('./get_sessions_request')
	},
	{
		method: 'put',
		path: 'password',
		requestClass: require('./change_password_request')
	}
];

class Users extends Restful {

	get collectionName () {
		return 'users';	// name of the data collection
	}

	get modelName () {
		return 'user';	// name of the data model
	}

	get creatorClass () {
		return UserCreator;	// use this class to instantiate users
	}

	get modelClass () {
		return User;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single user';
	}

	get updaterClass () {
		return UserUpdater;	// use this class to update users
	}

	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(USERS_STANDARD_ROUTES);
		return [...standardRoutes, ...USERS_ADDITIONAL_ROUTES];
	}

	describeErrors () {
		return {
			'Users': Errors
		};
	}
}

module.exports = Users;

