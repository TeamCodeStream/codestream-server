'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');

const STANDARD_ROUTES = [
	{
		id: 'get',
		method: 'get',
		path: '$BASE/:id',
		requestClass: require('./get_request')
	},
	{
		id: 'getMany',
		method: 'get',
		path: '$BASE',
		requestClass: require('./get_many_request')
	},
	{
		id: 'post',
		method: 'post',
		path: '$BASE',
		requestClass: require('./post_request')
	},
	{
		id: 'put',
		method: 'put',
		path: '$BASE/:id',
		requestClass: require('./put_request')
	},
	{
		id: 'delete',
		method: 'delete',
		path: '$BASE/:id',
		requestClass: require('./delete_request')
	}
];

class Restful extends APIServerModule {

	getRoutes (options = {}) {
		this.routes = [];
		options.want = options.want || [];
		options.requestClasses = options.requestClasses || {};
		STANDARD_ROUTES.forEach(route => {
			this.makeRoute(route, options);
		});
		return this.routes;
	}

	makeRoute (route, options) {
		route = Object.assign({}, route);
		if (options.want.indexOf(route.id) !== -1) {
			route.requestClass = options.requestClasses[route.id] || route.requestClass;
			route.path = route.path.replace('$BASE', options.baseRouteName);
			this.routes.push(route);
		}
	}
}

module.exports = Restful;
