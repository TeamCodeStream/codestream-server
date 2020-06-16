// provides a basic error handler class, shielding callers from annoying
// implementation details ... the idea is to specify a set of errors in a
// separate errors.js file, these can be invoked by a simple tag to bubble
// the associated error information up the callback chain

'use strict';

class ErrorHandler {

	// set of errors provided by an errors.js
	constructor (errors = {}) {
		this.initialize(errors);
	}

	// set up our initial set of errors
	initialize (errors) {
		this.errors = errors;
	}

	// add more errors (from another module's errors.js, for example)
	add (errors) {
		Object.assign(this.errors, errors);
	}

	// create an error object based on the tag passed in and any associated info
	error (key, info) {
		if (!this.errors[key]) {
			return {
				code: 'UNKNOWN',
				message: 'Unknown error'
			}; // don't let this happen
		}
		// make a copy of the error object, we don't want to alter the original!
		return Object.assign({}, this.errors[key], info);
	}

	// create an error object based on the code passed in
	errorByCode (code, info) {
		const tag = Object.keys(this.errors).find(key => {
			return this.errors[key].code === code;
		});
		if (tag) {
			return this.error(tag, info);
		}
		else {
			return this.error('???', info);	// will return an UNKNOWN error, not ideal at all
		}
	}

	// syntactic sugar for a special kind of error
	dataError (error) {
		return this.error('data', { reason: error });
	}

	// log this error, safely turning it into a string
	static log (error) {
		let message = typeof error === 'string' ? error : JSON.stringify(error);
		if (error.stack) {
			message += `\n${error.stack}`;
		}
		return message;
	}

	// prepare this error object for return to the client ... we recognize an
	// "internal" flag as stuff that's too technical or details to be of interest
	// to the client, and delete that (it should be logged first on the server side)
	static toClient (error) {
		if (typeof error !== 'object') {
			return error;
		}
		// make a copy ... we don't want to alter the original!
		let clientError = Object.assign({}, error);
		if (clientError.internal) {
			// for internal errors, all we return is the code
			clientError = {
				code: clientError.code
			};
		}
		delete clientError.description;
		return clientError;
	}
}

module.exports = ErrorHandler;
