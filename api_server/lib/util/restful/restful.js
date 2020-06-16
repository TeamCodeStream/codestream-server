// Provides a restful module to handle CRUD (Create, Read, Update, Delete) operations
// for a module, assuming a collection of documents that become models in memory

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const Errors = require('./errors');

// These standard routes provide the basic CRUD operations for a restful server,
// each route can be turned on or off as needed by the overriding module
// we assume all the routes share a base path, indicated here by $BASE
const STANDARD_ROUTES = [
	{	// fetch a single document by ID
		id: 'get',
		method: 'get',
		path: '$BASE/:id',
		requestClass: require('./get_request')
	},
	{	// fetch multiple documents via application-supplied query constraints
		id: 'getMany',
		method: 'get',
		path: '$BASE',
		requestClass: require('./get_many_request')
	},
	{	// create a document
		id: 'post',
		method: 'post',
		path: '$BASE',
		requestClass: require('./post_request')
	},
	{	// update a document by ID
		id: 'put',
		method: 'put',
		path: '$BASE/:id',
		requestClass: require('./put_request')
	},
	{	// delete a document by ID
		id: 'delete',
		method: 'delete',
		path: '$BASE/:id',
		requestClass: require('./delete_request')
	}
];

class Restful extends APIServerModule {

	// get all the routes for this module ... we'll combine whatever standard
	// restful routes the derived class wants ... the derived class can override
	// this function to provide additional non-standard routes
	getRoutes (options = {}) {
		this.routes = [];
		options.want = options.want || [];
		options.requestClasses = options.requestClasses || {};
		STANDARD_ROUTES.forEach(route => {
			this.makeRoute(route, options);
		});
		return this.routes;
	}

	// make a route object describing a particular route
	makeRoute (route, options) {
		route = Object.assign({}, route); // we don't want to alter the defined constants, so make a copy
		if (options.want.includes(route.id)) {
			// module wants this route
			route.requestClass = options.requestClasses[route.id] || route.requestClass;
			route.path = route.path.replace('$BASE', options.baseRouteName);	// baseRouteName provided by the derived class
			this.routes.push(route);
		}
	}
	
	// describe any models associated with this module, for help
	describeModels () {
		if (this.modelName && this.modelClass) {
			const attributeDefinitions = new this.modelClass().getValidator().attributeDefinitions;
			return [{
				name: this.modelName,
				attributes: attributeDefinitions,
				description: this.modelDescription || 'model'
			}];
		}
		return [];
	}

	// describe any errors associated with this module, for help
	describeErrors () {
		return {
			['Restful API']: Errors 
		};
	}
}

module.exports = Restful;
