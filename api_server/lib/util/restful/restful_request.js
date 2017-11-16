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

	allowParameters (where, allowedParameters, callback) {
		let parameters = this.request[where];
		Allow(parameters, allowedParameters);
		process.nextTick(callback);
	}

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

	sanitizeModel (model, callback) {
		this.sanitizedObjects.push(model.getSanitizedObject());
		process.nextTick(callback);
	}
}

module.exports = RestfulRequest;
