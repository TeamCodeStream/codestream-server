'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
//const NewRelic = require('newrelic');

class NewRelicModule extends APIServerModule {

	services () {
		return async () => {
			return {};
			/*
			this.newrelic = NewRelic;
			return { newrelic: this.newrelic };
			*/
		};
	}
}

module.exports = NewRelicModule;
