'use strict';

var API_Server_Module = require(process.env.CI_API_TOP + '/lib/api_server/api_server_module.js');

const STANDARD_ROUTES = [
	{
		id: 'get',
		method: 'get',
		path: '$BASE/:id',
		request_class: require('./get_request')
	},
	{
		id: 'get_many',
		method: 'get',
		path: '$BASE',
		request_class: require('./get_many_request')
	},
	{
		id: 'post',
		method: 'post',
		path: '$BASE',
		request_class: require('./post_request')
	},
	{
		id: 'put',
		method: 'put',
		path: '$BASE/:id',
		request_class: require('./put_request')
	},
	{
		id: 'delete',
		method: 'delete',
		path: '$BASE/:id',
		request_class: require('./delete_request')
	}
];

class Restful extends API_Server_Module {

	get_routes (options = {}) {
		this.routes = [];
		options.want = options.want || [];
		options.request_classes = options.request_classes || {};
		STANDARD_ROUTES.forEach(route => {
			this.make_route(route, options);
		});
		return this.routes;
	}

	make_route (route, options) {
		route = Object.assign({}, route);
		if (options.want.indexOf(route.id) !== -1) {
			route.request_class = options.request_classes[route.id] || route.request_class;
			route.path = route.path.replace('$BASE', options.base_route_name);
			this.routes.push(route);
		}
	}
}

module.exports = Restful;
