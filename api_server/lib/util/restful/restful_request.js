// provides an abstract base class for all restful requests, mainly to provide
// several utility functions

'use strict';

var APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
var ErrorHandler = require(process.env.CS_API_TOP + '/lib/util/error_handler');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const Errors = require('./errors');

class RestfulRequest extends APIRequest {

	constructor (options) {
		super(options);
		this.errorHandler = new ErrorHandler(Errors);
	}

	// allow these parameters, and only these parameters, in the request query or body
	allowParameters (where, allowedParameters, callback) {
		// this will quietly eliminate any parameters that are not allowed
		let parameters = this.request[where];
		Allow(parameters, allowedParameters);
		process.nextTick(callback);
	}

	// require these parameters in the request query or body
	requireParameters (where, requiredParameters, callback) {
		let parameters = this.request[where];
		if (typeof parameters !== 'object') { return callback(); }
		let missingParameters = [];
		requiredParameters.forEach(parameter => {
			if (typeof parameters[parameter] === 'undefined') {
				missingParameters.push(parameter);
			}
		});
		if (missingParameters.length) {
			missingParameters = missingParameters.length > 1 ? missingParameters : missingParameters[0];
			return callback(this.errorHandler.error('parameterRequired', { info: missingParameters }));
		}
		else {
			process.nextTick(callback);
		}
	}

	// sanitize these models (eliminate attributes we don't want the client to see)
	sanitizeModels (models, callback) {
		let sanitizedObjects = [];
		BoundAsync.forEachLimit(
			this,
			models,
			20,
			(model, foreachCallback) => {
				sanitizedObjects.push(model.getSanitizedObject());
				process.nextTick(foreachCallback);
			},
			() => {
				callback(null, sanitizedObjects);
			}
		);
	}

	// sanitize a single model (eliminate attributes we don't want the client to see)
	sanitizeModel (model, callback) {
		this.sanitizedObjects.push(model.getSanitizedObject());
		process.nextTick(callback);
	}
}

module.exports = RestfulRequest;
