// base class for all API Server modules ... an API Server module is a discrete
// set of functionality which can provide routes, middleware, services, or a source of data
// to the app

'use strict';

class APIServerModule {

	// FIXME: what exactly is this object - there is no logger property in the config object
	constructor (config = {}) {
		Object.assign(this, config);
	}

	getRoutes () { }

	getDependencies () { }

	async initialize () {
	}

	describeModels () {
		return [];
	}

	describeErrors () {
		return {};
	}
}

module.exports = APIServerModule;
