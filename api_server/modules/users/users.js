// provide a module to handle requests associated with users

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const UserCreator = require('./user_creator');
const UserUpdater = require('./user_updater');
const User = require('./user');
const CORS = require('cors');
const URL = require('url');

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

// parse domain out of url
const _parseDomain = url => {
	let parsed;
	try {
		parsed = URL.parse(url);
	}
	catch (error) {
		return url;
	}
	if (!parsed || !parsed.hostname) {
		return url;
	}
	const parts = parsed.hostname.split('.').reverse();
	return `${parts[1]}.${parts[0]}`;
};

// return a middleware function that checks if the origin
// matches the home of the MS Teams bot
const _CorsForTeamsIntegration = api => {
	const corsOptions = {
		origin: (origin, callback) => {
			if (
				!origin ||
				origin === 'null' ||
				origin === 'undefined' ||
				origin === api.config.teams.botOrigin
			) {
				return callback(null, true);
			}
			const originDomain = _parseDomain(origin);
			const botOriginDomain = _parseDomain(api.config.teams.botOrigin);
			if (originDomain.toLowerCase() === botOriginDomain.toLowerCase() ||
				originDomain.toLowerCase() === 'codestream.com'
			) {
				return callback(null, true);
			}
			else {
				const error = `unrecognized origin ${origin}`;
				api.warn(error);
				return callback(error);
			}
		}
	};
	return CORS(corsOptions);
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
		requestClass: require('./login_request'),
		middleware: _CorsForTeamsIntegration
	},
	{
		method: 'options',
		path: 'no-auth/login',
		func: CORS()	// enable pre-flight CORS requests to this route
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

	get updaterClass () {
		return UserUpdater;	// use this class to update users
	}

	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(USERS_STANDARD_ROUTES);
		return [...standardRoutes, ...USERS_ADDITIONAL_ROUTES];
	}
}

module.exports = Users;

