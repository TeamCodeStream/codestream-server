// provides an abstract base class for all restful requests, mainly to provide
// several utility functions

'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
const ErrorHandler = require(process.env.CS_API_TOP + '/server_utils/error_handler');
const RequireAllow = require(process.env.CS_API_TOP + '/server_utils/require_allow');
const Errors = require('./errors');

class RestfulRequest extends APIRequest {

	constructor (options) {
		super(options);
		this.errorHandler = new ErrorHandler(Errors);
	}

	// allow certain parameters and require certain parameters, in the request query or body
	async requireAllowParameters (where, requiredAndOptionalParameters) {
		const info = RequireAllow.requireAllow(this.request[where], requiredAndOptionalParameters);
		if (!info) {
			// all good
			return;
		}
		if (info.missing && info.missing.length > 0) {
			// required
			throw this.errorHandler.error('parameterRequired', { info: info.missing.join(',') });
		}
		else if (info.invalid && info.invalid.length > 0) {
			// invalid type
			throw this.errorHandler.error('invalidParameter', { info: info.invalid.join(',') });
		}
		else if (info.deleted && info.deleted.length > 0) {
			// not allowed
			this.warn(`These attributes were deleted: ${info.deleted.join(',')}`);
		}
	}

	// sanitize these models (eliminate attributes we don't want the client to see)
	async sanitizeModels (models) {
		const sanitizedObjects = [];
		for (var model of models) {
			sanitizedObjects.push(model.getSanitizedObject({ request: this }));
		}
		return sanitizedObjects;
	}

	// sanitize a single model (eliminate attributes we don't want the client to see)
	sanitizeModel (model) {
		this.sanitizedObjects.push(model.getSanitizedObject({ request: this }));
	}
}

module.exports = RestfulRequest;
