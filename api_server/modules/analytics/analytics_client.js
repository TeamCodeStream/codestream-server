// provides an analytics wrapper client, sparing the caller some of the implementation details

'use strict';

class AnalyticsClient {

	constructor (options) {
		Object.assign(this, options);
	}

	// track an analytics event
	track (event, data, options = {}) {
		if (this._requestSaysToBlockTracking(options)) {
			// we are blocking tracking, for testing purposes
			if (options.request) {
				options.request.log('Would have sent tracking event: ' + event);
			}
			return;
		}

		const trackData = {
			userId: options.user && options.user.id,
			event,
			properties: data
		};
		
		if (this._requestSaysToTestTracking(options)) {
			// we received a header in the request asking us to divert this tracking event
			// instead of actually sending it, for testing purposes ... we'll
			// emit the request body to the callback provided
			if (options.request) {
				options.request.log(`Diverting tracking event ${event} to test callback`);
			}
			if (this.testCallback) {
				this.testCallback('track', trackData, options.user, options.request);
			}
			return;
		}

		this.segment.track({
			userId: options.user && options.user.id,
			event,
			properties: data
		});
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
}

module.exports = AnalyticsClient;
