'use strict';

var API_Request = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
var Error_Handler = require(process.env.CS_API_TOP + '/lib/util/error_handler');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');
const Errors = require('./errors');

class Restful_Request extends API_Request {

	constructor (options) {
		super(options);
		this.error_handler = new Error_Handler(Errors);
	}

	allow_parameters (where, allowed_parameters, callback) {
		let parameters = this.request[where];
		Allow(parameters, allowed_parameters);
		process.nextTick(callback);
	}

	require_parameters (where, required_parameters, callback) {
		let parameters = this.request[where];
		if (typeof parameters !== 'object') { return callback(); }
		let missing_parameters = [];
		required_parameters.forEach(parameter => {
			if (typeof parameters[parameter] === 'undefined') {
				missing_parameters.push(parameter);
			}
		});
		if (missing_parameters.length) {
			missing_parameters = missing_parameters.length > 1 ? missing_parameters : missing_parameters[0];
			return callback(this.error_handler.error('parameter_required', { info: missing_parameters }));
		}
		else {
			process.nextTick(callback);
		}
	}
}

module.exports = Restful_Request;
