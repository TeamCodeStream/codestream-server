// provide a module to handle requests associated with users

'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const UserCreator = require('./user_creator');
const UserUpdater = require('./user_updater');
const UserDeleter = require('./user_deleter');
const SignupTokens = require('./signup_tokens');
const User = require('./user');
const Errors = require('./errors');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');

const DEPENDENCIES = [
	'authenticator'	// need the user
];

// expose these restful routes
const USERS_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'put', 'post', 'delete'],
	baseRouteName: 'users',
	requestClasses: {
		'get': require('./get_user_request'),
		'getMany': require('./get_users_request'),
		'put': require('./put_user_request'),
		'post': require('./post_user_request'),
		'delete': require('./delete_user_request')
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
		path: 'login',
		requestClass: require('./raw_login_request')
	},
	{
		method: 'put',
		path: 'read/:streamId',
		requestClass: require('./read_request')
	},
	{
		method: 'put',
		path: 'unread/:postId',
		requestClass: require('./unread_request')
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
	},
	{
		method: 'put',
		path: 'no-auth/forgot-password',
		requestClass: require('./forgot_password_request')
	},
	{
		method: 'get',
		path: 'no-auth/check-reset',
		requestClass: require('./check_reset_request')
	},
	{
		method: 'put',
		path: 'no-auth/resend-confirm',
		requestClass: require('./resend_confirm_request')
	},
	{
		method: 'put',
		path: 'no-auth/check-signup',
		requestClass: require('./check_signup_request')
	},
	{
		method: 'get',
		path: 'no-auth/invite-info',
		requestClass: require('./invite_info_request')
	},
	{
		method: 'put',
		path: 'change-email',
		requestClass: require('./change_email_request')
	},
	{
		method: 'put',
		path: 'bump-posts',
		requestClass: require('./bump_posts_request')
	}
];

class Users extends Restful {

	constructor (options) {
		super(options);
		this.errorHandler = new ErrorHandler(Errors);
	}

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

	get deleterClass () {
		return UserDeleter;	// user this class to delete users
	}

	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(USERS_STANDARD_ROUTES);
		return [...standardRoutes, ...USERS_ADDITIONAL_ROUTES];
	}

	services () {
		// return a function that, when invoked, returns a service to handle signup tokens
		return async () => {
			this.api.log('Initializing signup token service...');
			this.signupTokens = new SignupTokens({ api: this.api });
			return { signupTokens: this.signupTokens };
		};
	}

	getDependencies () {
		return DEPENDENCIES;
	}

	middlewares () {
		return async (request, response, next) => {

			// for users in "maintenance mode", set header and return error
			if (request.user && request.user.get('inMaintenanceMode')) {
				response.set('X-CS-API-Maintenance-Mode', 1);
				request.abortWith = {
					status: 403,
					error: this.errorHandler.error('inMaintenanceMode') 
				};
			}

			// for users for whom a password set is required, return error unless it is the
			// actual call to set their password
			else if (
				request.user && 
				request.user.get('mustSetPassword') && 
				(
					!(
						request.path.toLowerCase() === '/password' &&
						request.method.toLowerCase() === 'put'
					) &&
					!(
						request.path.toLowerCase() === '/login' &&
						request.method.toLowerCase() === 'put'
					) &&
					!(
						request.path.match(/\/web/i) &&
						request.method.toLowerCase() === 'get'
					)
				)
			) {
				request.abortWith = {
					status: 403,
					error: this.errorHandler.error('mustSetPassword')
				};
			}

			next();
		};
	}


	initialize () {
		this.signupTokens.initialize();
	}

	describeErrors () {
		return {
			'Users': Errors
		};
	}
}

module.exports = Users;

