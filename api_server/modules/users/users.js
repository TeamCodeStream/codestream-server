// provide a module to handle requests associated with users

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const UserCreator = require('./user_creator');
const UserUpdater = require('./user_updater');
const SignupTokens = require('./signup_tokens');
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
		path: 'no-auth/reset-password',
		requestClass: require('./reset_password_request')
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
		method: 'put',
		path: 'change-email',
		requestClass: require('./change_email_request')
	},
	{
		method: 'put',
		path: '/no-auth/change-email-confirm',
		requestClass: require('./change_email_confirm_request')
	},
	{
		method: 'put',
		path: '/no-auth/provider-connect/:provider',
		requestClass: require('./provider_connect_request')
	},
	{
		method: 'get',
		path: '/no-auth/provider-auth/:provider',
		requestClass: require('./provider_auth_request')
	},
	{
		method: 'get',
		path: '/no-auth/provider-token/:provider/:environment',
		requestClass: require('./provider_token_request')
	},
	{
		method: 'get',
		path: '/provider-auth-code',
		requestClass: require('./provider_authcode_request')
	},
	{
		method: 'put',
		path: '/provider-deauth/:provider',
		requestClass: require('./provider_deauth_request')
	},
	{
		method: 'put',
		path: 'bump-posts',
		requestClass: require('./bump_posts_request')
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

	services () {
		// return a function that, when invoked, returns a service to handle signup tokens
		return async () => {
			this.api.log('Initializing signup token service...');
			this.signupTokens = new SignupTokens({ api: this.api });
			return { signupTokens: this.signupTokens };
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

