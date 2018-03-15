// provides an analytics service to the API server, allowing analytics events to be
// tracked server-side
'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
var MixPanel = require('mixpanel');
var AnalyticsClient = require('./analytics_client');

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
			this.analyticsClient = new AnalyticsClient({
				mixPanel: this.mixPanel,
				testCallback: this.testCallback.bind(this)
			});
			return callback(null, [{ analytics: this.analyticsClient }]);
		};
	}

	// when testing tracking, we'll get the event data that would otherwise be sent to
	// the mixpanel server through this callback, we'll send it along through the
	// user's me-channel, which the test client should be listening to
	testCallback (type, event, data, user, request) {
		if (!user || !this.api.services.messager) { return; }
		let channel = `user-${user.id}`;
		let requestCopy = Object.assign({}, request);	// override test setting indicating not to send pubnub messages
		requestCopy.headers = Object.assign({}, request.headers);
		delete requestCopy.headers['x-cs-block-message-sends'];
		let message = { type, event, data };
		this.api.services.messager.publish(
			message,
			channel,
			() => {},
			request
		);
	}

}

module.exports = Analytics;
