// provides an analytics wrapper client, sparing the caller some of the implementation details

'use strict';

//const AnalyticsNode = require('analytics-node');
const Fetch = require('node-fetch');
const UUID = require('uuid').v4;

class AnalyticsClient {

	constructor (config) {
		// this config comes from global config.telemetry.segment, plus additional runtime options
		this.config = config || {};
		//if (this.config.token) {
		//	this.segment = new AnalyticsNode(this.config.token);
		//}
		//else {
		//	this.warn('No Segment token provided, no telemetry will be available');
		//}
	}

	// track an analytics event
	track (event, data, options = {}) {
		//if (!this.segment) { 
		//	this.log('Would have sent tracking event, tracking disabled: ' + event);
		//	return; 
		//}

		if (this._requestSaysToBlockTracking(options)) {
			// we are blocking tracking, for testing purposes
			this.log('Would have sent tracking event: ' + event);
			return;
		}

		const trackData = {
			event,
			properties: data,
			messageId: UUID(),
			timestamp: new Date(),
			type: "track",
			anonymousId: UUID(),
			session_id: UUID()
		};
		const nrUserId = options.user ? options.user.get('nrUserId') : options.nrUserId;
		if (nrUserId) {
			trackData.userId = nrUserId; //userId;
		}

		if (this._requestSaysToTestTracking(options)) {
			// we received a header in the request asking us to divert this tracking event
			// instead of actually sending it, for testing purposes ... we'll
			// emit the request body to the callback provided
			this.log(`Diverting tracking event ${event} to test callback`);
			if (this.config.testCallback) {
				this.config.testCallback('track', trackData, options.user, options.request);
			}
			return;
		}

		//this.segment.track(trackData);
		if (options.request) {
			options.request.log('TRACKING TO ' + this.config.telemetryEndpoint + '/events');
			options.request.log('trackData: ' + JSON.stringify(trackData));
		}
		Fetch(
			this.config.telemetryEndpoint + '/events',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(trackData)
			}
		);
	}


	// track an analytics event, extracting super-properties
	async trackWithSuperProperties(event, data, options = {}) {
		const { user, team, company, request } = options;
		// check if user has opted out
		const preferences = (user && user.get('preferences')) || {};
		if (preferences.telemetryConsent === false) { // note: undefined is not an opt-out, so it's opt-in by default
			return ;
		}

		const trackObject = { 
			platform: 'codestream',
			path: 'N/A (codestream)',
			section: 'N/A (codestream)'
		};
		const metaData = {};
		if (user) {
			//trackObject.user_id = user.get('nrUserId');
			metaData.codestream_first_signin = new Date(user.get('createdAt')).toISOString();
		}

		if (team) {
			metaData.codestream_organization_created = new Date(team.get('createdAt')).toISOString();
		}

		if (company) {
			metaData.codestream_organization_id = company.id;
			metaData.codestream_nr_organization_id = company.get('linkedNROrgId');
		}

		// translate the runtime environment into a region, if possible
		const { environmentGroup } = request.api.config;
		const { runTimeEnvironment } = request.api.config.sharedGeneral;
		if (environmentGroup && environmentGroup[runTimeEnvironment]) {
			metaData.codestream_region = environmentGroup[runTimeEnvironment].name;
		}

		trackObject.meta_data_15 = JSON.stringify(metaData);
		Object.assign(trackObject, data);
		this.track(
			event,
			trackObject,
			{ request, user, userId: options.userId }
		);
	}

	// determine if special header was sent with the request that says to block tracking
	_requestSaysToBlockTracking (options) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-block-tracking']
		);
	}

	// determine if special header was sent with the request that says to test tracking,
	// meaning we'll not actually send events out but send them through a pubnub channel
	// to verify content
	_requestSaysToTestTracking (options) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-test-tracking']
		);
	}

	log (message) {
		if (this.config.logger) {
			this.config.logger.log(message);
		}
	}

	warn (message) {
		if (this.config.logger) {
			this.config.logger.warn(message);
		}
	}
}

module.exports = AnalyticsClient;
