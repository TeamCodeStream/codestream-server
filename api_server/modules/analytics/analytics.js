// provides an analytics service to the API server, allowing analytics events to be
// tracked server-side
'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
var MixPanel = require('mixpanel');

class Analytics extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the mixpanel client as
		// the analytics service
		return (callback) => {
			if (!this.api.config.mixpanel) {
				this.api.warn('Will not connect to MixPanel, no MixPanel configuration supplied');
				return process.nextTick(callback);
			}

			this.api.log('Connecting to MixPanel...');
            try {
				this.mixPanel = new MixPanel.init(this.api.config.mixpanel.token, { protocol: 'https' });
            }
			catch (error) {
				return callback(error);
			}
			return callback(null, [{ analytics: this.mixPanel }]);
		};
	}
}

module.exports = Analytics;
