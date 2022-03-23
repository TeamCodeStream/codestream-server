// provides an analytics service to the API server, allowing analytics events to be
// tracked server-side
'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
const AnalyticsClient = require('./analytics_client');

const ROUTES = [
	{
		method: 'get',
		path: '/no-auth/telemetry-key',
		func: 'handleTelemetryKey',
		describe: 'describeTelemetryKey'
	}
];

class Analytics extends APIServerModule {

	getRoutes () {
		return ROUTES;
	}

	services () {
		// return a function that, when invoked, returns a service structure with the 
		// segment analytics client as the analytics service
		return async () => {
			this.api.log('Connecting to Segment Analytics...');
			let segmentConfig = (this.api.config.telemetry && this.api.config.telemetry.segment) || {};
			segmentConfig = Object.assign({}, segmentConfig, {
				testCallback: this.testCallback.bind(this),
				logger: this.api
			});
			this.analyticsClient = new AnalyticsClient(segmentConfig);
			return { analytics: this.analyticsClient };
		};
	}

	// when testing tracking, we'll get the event data that would otherwise be sent to
	// the segment analytics server through this callback, we'll send it along through the
	// user's me-channel, which the test client should be listening to
	async testCallback (type, data, user, request) {
		if (!this.api.services.broadcaster) { return; }
		if (!user && !request.request.headers['x-cs-track-channel']) { return; }
		const channel = request.request.headers['x-cs-track-channel'] || `user-${user.id}`;
		const message = { type, data, requestId: request.request.id };
		await this.api.services.broadcaster.publish(
			message,
			channel,
			{ request }
		);
	}
	
	// handle request to fetch telemetry keys, one level of indirection used to retrieve
	// the keys the client will use for telemetry (this is a write key and can not be used 
	// to read anything)
	handleTelemetryKey (request, response) {
		const inSecret = decodeURIComponent(request.query.secret || '');
		if (!inSecret || inSecret !== this.api.config.universalSecrets.telemetry) {
			const error = 'incorrect telemetry secret';
			this.api.warn(error);
			return response.status(403).send({ error });
		}
		const token = this.api.config.telemetry.segment.token;
		if (!token) {
			const error = 'no telemetry token available';
			this.api.warn(error);
			return response.status(403).send({ error });
		}
		response.send({
			key: this.api.config.telemetry.segment.token
		});
	}

	describeTelemetryKey () {
		return {
			tag: 'telemetry-key',
			summary: 'Retrieve telemetry key',
			description: 'Retrieve telemetry key for use with telemetry service',
			access: 'User must provide the secret',
			input: 'Specify the secret in the query parameter "secret"',
			returns: {
				summary: 'The telemetry key to use when making client-side telemetry calls',
				looksLike: {
					key: '<The key>'
				}
			}
		};
	}

}

module.exports = Analytics;
