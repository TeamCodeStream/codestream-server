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
