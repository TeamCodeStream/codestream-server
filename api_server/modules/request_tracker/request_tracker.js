// provide middleware and service to track requests, ensuring that when a node process is terminated,
// the process is not immediately killed, but is given the chance to complete all requests first

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');

const DEPENDENCIES = [
	'request_id'
];

class RequestTracker extends APIServerModule {

	constructor (config) {
		super(config);
		this.trackedRequests = {};
	}

	getDependencies () {
		return DEPENDENCIES;
	}

	services () {
		return async () => {
			return { requestTracker: this };
		};
	}

	middlewares () {
		return (request, response, next) => {
			this.trackRequest(request);
			response.on('finish', () => {
				this.maybeUntrackRequest(request);
			});
			response.on('close', () => {
				this.maybeUntrackRequest(request);
			});
			response.on('complete', () => {
				this.untrackRequest(request);
			});
			process.nextTick(next);
		};
	}

	// track a new request
	trackRequest (request) {
		this.trackedRequests[request.id] = request;
	}

	// stop tracking a request, unless it has declared itself "keep open"
	maybeUntrackRequest (request) {
		if (!request.keepOpen) {
			this.untrackRequest(request);
		}
	}

	// stop tracking a request, and announce to the api server if we have no more
	// requests to work on
	untrackRequest (request) {
		delete this.trackedRequests[request.id];
		if (Object.keys(this.trackedRequests).length === 0) {
			this.api.noMoreRequests();
		}
		else if (this.api.waitingToShutdown()) {
			this.api.waitingForRequests(Object.keys(this.trackedRequests), request.id);
		}
	}

	// what requests are we currently serving?
	myOpenRequests () {
		return Object.keys(this.trackedRequests);
	}
}

module.exports = RequestTracker;
