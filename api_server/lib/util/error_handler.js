'use strict';

class Error_Handler {

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

	data_error (error) {
		return this.error('data', { reason: error });
	}

	static log (error) {
		return typeof error === 'string' ? error : JSON.stringify(error);
	}

	static to_client (error) {
		if (typeof error !== 'object') {
			return error;
		}
		let client_error = Object.assign({}, error);
		if (client_error.internal) {
			delete client_error.internal;
			delete client_error.reason;
		}
		return client_error;
	}
}

module.exports = Error_Handler;
