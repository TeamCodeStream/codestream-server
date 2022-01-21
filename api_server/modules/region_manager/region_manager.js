// provides a service to the API server which manages concerns related to regional hosts

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const RegionManagerService = require('./region_manager_service');

class RegionManager extends APIServerModule {

	services () {
		// return a function that, when invoked, will return a service structure with 
		// region management as a service to the API server app 
		return async () => {
			this.api.log('Instantiating region manager service...');
			this.regionManager = new RegionManagerService({ api: this.api });
			return { regionManager: this.regionManager };
		};
	}
}

module.exports = RegionManager;
