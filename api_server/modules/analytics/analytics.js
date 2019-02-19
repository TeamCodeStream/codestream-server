// provides an analytics service to the API server, allowing analytics events to be
// tracked server-side
'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
const AnalyticsNode = require('analytics-node');
const AnalyticsClient = require('./analytics_client');

class Analytics extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the 
		// segment analytics client as the analytics service
		return async () => {
			if (!this.api.config.segment) {
				return this.api.warn('Will not connect to Segment Analytics, no configuration supplied');
			}

			this.api.log('Connecting to Segment Analytics...');
			this.segment = new AnalyticsNode(this.api.config.segment.token);
			this.analyticsClient = new AnalyticsClient({
				segment: this.segment,
				testCallback: this.testCallback.bind(this)
			});
			return { analytics: this.analyticsClient };
		};
	}

	// when testing tracking, we'll get the event data that would otherwise be sent to
	// the segment analytics server through this callback, we'll send it along through the
	// user's me-channel, which the test client should be listening to
	async testCallback (type, data, user, request) {
		if (!user || !this.api.services.messager) { return; }
		const channel = request.request.headers['x-cs-track-channel'] || `user-${user.id}`;
		const message = { type, data };
		await this.api.services.messager.publish(
			message,
			channel,
			request
		);
	}
}

module.exports = Analytics;
