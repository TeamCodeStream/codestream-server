'use strict';

class ErrorHandler {

	constructor (errors = {}) {
		this.initialize(errors);
	}

	initialize (errors) {
		this.errors = errors;
	}

	add (errors) {
		Object.assign(this.errors, errors);
	}

	error (key, info) {
		if (!this.errors[key]) {
			return {
				code: 'UNKNOWN',
				message: 'Unknown error'
			}; // don't let this happen
		}
		return Object.assign({}, this.errors[key], info);
	}

	dataError (error) {
		return this.error('data', { reason: error });
	}

	static log (error) {
		return typeof error === 'string' ? error : JSON.stringify(error);
	}

	static toClient (error) {
		if (typeof error !== 'object') {
			return error;
		}
		let clientError = Object.assign({}, error);
		if (clientError.internal) {
			delete clientError.internal;
			delete clientError.reason;
		}
		return clientError;
	}
}

module.exports = ErrorHandler;
