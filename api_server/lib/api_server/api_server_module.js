'use strict';

class API_Server_Module {

	constructor (config = {}) {
		Object.assign(this, config);
		this.logger = config.logger || this.api;
	}

	set_config (config) {
		Object.assign(this, config);
	}

	get_routes () { }

	get_dependencies () { }

}

module.exports = API_Server_Module;
