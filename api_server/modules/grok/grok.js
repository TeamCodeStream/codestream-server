'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
const GrokClient = require('./grok_client');

class Grok extends APIServerModule {

	constructor(options) { 
		super(options);
	}
	
	services () {
		// return a function that, when invoked, returns a service structure with the 
		// segment analytics client as the analytics service
		return async () => {
			
			this.grokClient = new GrokClient({
				api: this.api,
				data: this.api.data
			});
			return { grok: this.grokClient };
		};
	}

}

module.exports = Grok;

