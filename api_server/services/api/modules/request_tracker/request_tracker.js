'use strict';

var API_Server_Module = require(process.env.CI_API_TOP + '/lib/api_server/api_server_module.js');

const DEPENDENCIES = [
	'request_id'
];

class Request_Tracker extends API_Server_Module {

	constructor (config) {
		super(config);
		this.tracked_requests = {};
	}

	get_dependencies () {
		return DEPENDENCIES;
	}

	services () {
		return (callback) => {
			return callback(null, [{ request_tracker: this }]);
		};
	}

	middlewares () {
		return (request, response, next) => {
			this.track_request(request);
			response.on('finish', () => {
				this.maybe_untrack_request(request);
			});
			response.on('close', () => {
				this.maybe_untrack_request(request);
			});
			response.on('complete', () => {
				this.untrack_request(request);
			});
			process.nextTick(next);
		};
	}

	track_request (request) {
		this.tracked_requests[request.id] = request;
	}

	maybe_untrack_request (request) {
		if (!request.keep_open) {
			this.untrack_request(request);
		}
	}

	untrack_request (request) {
		delete this.tracked_requests[request.id];
		if (this.num_open_requests() === 0) {
			this.api.no_more_requests();
		}
	}

	num_open_requests () {
		return Object.keys(this.tracked_requests).length;
	}
}

module.exports = Request_Tracker;
