// provides a service to the API server which manages concerns related to environment hosts

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const EnvironmentManagerService = require('./environment_manager_service');

class EnvironmentManager extends APIServerModule {

	services () {
		// return a function that, when invoked, will return a service structure with 
		// environment management as a service to the API server app 
		return async () => {
			this.api.log('Instantiating environment manager service...');
			this.environmentManager = new EnvironmentManagerService({ 
				api: this.api
			});
			return { environmentManager: this.environmentManager };
		};
	}
}

module.exports = EnvironmentManager;
