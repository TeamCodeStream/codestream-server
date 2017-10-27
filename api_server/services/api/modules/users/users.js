'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var User_Creator = require('./user_creator');
//var User_Updater = require('./user_updater');
var User = require('./user');

const USERS_STANDARD_ROUTES = {
	want: ['get', 'get_many', 'post'],
	base_route_name: 'users',
	request_classes: {
		'get': require('./get_user_request'),
		'get_many': require('./get_users_request')
	}
};

const USERS_ADDITIONAL_ROUTES = [
	{
		method: 'post',
		path: 'no-auth/register',
		request_class: require('./register_request')
	},
	{
		method: 'post',
		path: 'no-auth/confirm',
		request_class: require('./confirm_request')
	},
	{
		method: 'put',
		path: 'no-auth/login',
		request_class: require('./login_request')
	}
];

class Users extends Restful {

	get collection_name () {
		return 'users';
	}

	get model_name () {
		return 'user';
	}

	get creator_class () {
		return User_Creator;
	}

	get model_class () {
		return User;
	}

/*
	get updater_class () {
		return User_Updater;
	}
*/

	get_routes () {
		let standard_routes = super.get_routes(USERS_STANDARD_ROUTES);
		return [...standard_routes, ...USERS_ADDITIONAL_ROUTES];
	}
}

module.exports = Users;
