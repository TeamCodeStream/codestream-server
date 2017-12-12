// base class for all API Server modules ... an API Server module is a discrete
// set of functionality which can provide routes, middleware, services, or a source of data
// to the app

'use strict';

class APIServerModule {

	constructor (config = {}) {
		Object.assign(this, config);
		this.logger = config.logger || this.api;
	}

	setConfig (config) {
		Object.assign(this, config);
	}

	getRoutes () { }

	getDependencies () { }

}

module.exports = APIServerModule;
