'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');

class NewRelicModule extends APIServerModule {

	services () {
		return async () => {
			this.newrelic = this.newrelic || require('newrelic');
			return { newrelic: this.newrelic };
		};
	}
}

module.exports = NewRelicModule;
