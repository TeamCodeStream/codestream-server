// provides an analytics wrapper client, sparing the caller some of the implementation details

'use strict';

const AnalyticsNode = require('analytics-node');

// FIXME: the this.config's in this class do not appear to be inline
// with the global config so I don't know what to do here.
class AnalyticsClient {

	constructor (config) {
		// FIXME: the global config has no property called 'token'.
		//    segment tokens are stored in the global config as
		//    config.telemetry.segment.token and config.telemetry.segment.webToken
		//    but I'm pretty sure this is a different config
		this.config = config || {};
		if (this.config.token) {
			this.segment = new AnalyticsNode(this.config.token);
		}
		else {
			this.warn('No Segment token provided, no telemetry will be available');
		}
	}

	// track an analytics event
	track (event, data, options = {}) {
		if (!this.segment) { 
			this.log('Would have sent tracking event, tracking disabled: ' + event);
			return; 
		}

		if (this._requestSaysToBlockTracking(options)) {
			// we are blocking tracking, for testing purposes
			this.log('Would have sent tracking event: ' + event);
			return;
		}

		const trackData = {
			event,
			properties: data
		};
		const userId = options.user ? options.user.id : options.userId;		
		if (userId) {
			trackData.userId = userId;
		}
		if (options.anonymousId) {
			trackData.anonymousId = options.anonymousId;
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

		this.segment.track(trackData);
	}

	// track an analytics event, extracting super-properties
	trackWithSuperProperties(event, data, options = {}) {
		const { user, team, company, request } = options;
		// check if user has opted out
		const preferences = (user && user.get('preferences')) || {};
		if (preferences.telemetryConsent === false) { // note: undefined is not an opt-out, so it's opt-in by default
			return ;
		}

		const trackObject = { };

		if (user) {
			Object.assign(trackObject, {
				distinct_id: user.id,
				'$email': user.get('email'),
				name: user.get('fullName'),
				'Join Method': user.get('joinMethod'),
				'Last Invite Type': user.get('lastInviteType')
			});
			if (user.get('registeredAt')) {
				trackObject['$created'] = new Date(user.get('registeredAt')).toISOString();
			}
			if (user.get('lastPostCreatedAt')) {
				trackObject['Date of Last Post'] = new Date(user.get('lastPostCreatedAt')).toISOString();
			}
	
		}

		if (team) {
			Object.assign(trackObject, {
				'Team ID': team.id,
				'Team Name': team.get('name'),
				'Team Size': (team.get('memberIds') || []).length,
				'Team Created Date': new Date(team.get('createdAt')).toISOString()
			});
		}

		if (company) {
			trackObject['Company Name'] = company.get('name');
			trackObject['Company ID'] = company.id;
			trackObject['Plan'] = company.get('plan');
			trackObject['Reporting Group'] = company.get('reportingGroup') || '';
			trackObject.company = {
				id: company.id,
				name: company.get('name'),
				plan: company.get('plan'),
				created_at: new Date(company.get('createdAt')).toISOString()
			};
			if (company.get('trialStartDate')) {
				trackObject.company.trialStart_at = new Date(company.get('trialStartDate')).toISOString();
			}
			if (company.get('trialEndDate')) {
				trackObject.company.trialEnd_at = new Date(company.get('trialEndDate')).toISOString();
			}
		}

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
