'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var UserCreator = require('./user_creator');
//var UserUpdater = require('./user_updater');
var User = require('./user');

const USERS_STANDARD_ROUTES = {
	want: ['get', 'getMany'],
	baseRouteName: 'users',
	requestClasses: {
		'get': require('./get_user_request'),
		'getMany': require('./get_users_request')
	}
};

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
	}
];

class Users extends Restful {

	get collectionName () {
		return 'users';
	}

	get modelName () {
		return 'user';
	}

	get creatorClass () {
		return UserCreator;
	}

	get modelClass () {
		return User;
	}

/*
	get updaterClass () {
		return UserUpdater;
	}
*/

	getRoutes () {
		let standardRoutes = super.getRoutes(USERS_STANDARD_ROUTES);
		return [...standardRoutes, ...USERS_ADDITIONAL_ROUTES];
	}
}

module.exports = Users;
