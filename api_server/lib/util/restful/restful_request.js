// provides an abstract base class for all restful requests, mainly to provide
// several utility functions

'use strict';

var APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
var ErrorHandler = require(process.env.CS_API_TOP + '/lib/util/error_handler');
var RequireAllow = require(process.env.CS_API_TOP + '/lib/util/require_allow');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const Errors = require('./errors');

class RestfulRequest extends APIRequest {

	constructor (options) {
		super(options);
		this.errorHandler = new ErrorHandler(Errors);
	}

	// allow certain parameters and require certain parameters, in the request query or body
	requireAllowParameters (where, requiredAndOptionalParameters, callback) {
		let info = RequireAllow.requireAllow(this.request[where], requiredAndOptionalParameters);
		if (!info) {
			// all good
			return callback();
		}
		if (info.missing && info.missing.length > 0) {
			// required
			return callback(this.errorHandler.error('parameterRequired', { info: info.missing.join(',') }));
		}
		else if (info.invalid && info.invalid.length > 0) {
			// invalid type
			return callback(this.errorHandler.error('invalidParameter', { info: info.invalid.join(',') }));
		}
		else if (info.deleted && info.deleted.length > 0) {
			// not allowed
			this.warn(`These attributes were deleted: ${info.deleted.join(',')}`);
		}
		process.nextTick(callback);
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
