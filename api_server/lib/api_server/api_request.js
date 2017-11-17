'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var APIRequestData = require('./api_request_data');
var ErrorHandler = require(process.env.CS_API_TOP + '/lib/util/error_handler');

class APIRequest {

	constructor (options) {
		Object.assign(this, options);
		this.responseIssued = false;						// this gets set when once the response has been issued
		this.responseData = {};							// prepare for any response data to be put in here
		this.data = new APIRequestData({					// wrapper for all collections relevant to this request
			api: this.api,
			request: this.request
		});
		this.user = this.request.user;
		this._setRequestPhases();
	}

	// Default requests have at least these phases:
	// Derived requests can override this behavior either by overriding the method in question or by changing the
	// whole structure of the request ... for consistency it is recommended to change the structure only when necessary to
	// suit a specialized application ... in general this structure should work very well for the vast majority of requests
	_setRequestPhases () {

		this.REQUEST_PHASES = [
			// initializion of data
			'initialize',
			// deeper authorization of the request (ACL) which may involve a closer inspection of the details of the request,
			// including reading some data into the data cache
			'authorize',
			// process the request, this is the meat of it, we maintain a data cache that handles all the database soft-locking and
			// caching so nothing is retrieved from the database more than once and no objects are repeated, we maintain the touched
			// objects here as well
			'process',
			// any changes are written to the database here, we acquire a hard lock on the data and handle any version conflicts and merges
			'persist',
			// send the response back to the client, along with any sanitized data
			'handleResponse',
			// do any post-processing, meaning any processing of the request that goes on after the response is sent back to the client
			'postProcess',
			// perform any additional persistence to the database, same as persist but here it is recognized that we have already sent
			// a response to the client
			'postProcessPersist',
			// final cleanup
			'cleanup',
			// close the request
			'close'
		];

		// This indicates the phase that handles a response, this phase will get executed regardless of the output of other phases
		this.RESPONSE_PHASE = 'handleResponse';
	}


	// execute a request phase
	executePhase (phase, callback) {
		if (typeof this[phase] !== 'function') {
			return process.nextTick(callback);
		}
		this[phase]((error) => {
			if (!error && phase === this.RESPONSE_PHASE) {
				this.responseIssued = true;
			}
			process.nextTick(() => {
				callback(error);
			});
		});
	}

	// initialize the request
	initialize (callback) {
		if (this.request.abortWith) {
			// middleware error
			this.statusCode = this.request.abortWith.status;
			return callback(this.request.abortWith.error);
		}
		this.request.keepOpen = true;
		this.makeData(callback);
	}

	makeData (callback) {
		this.data.makeData(error => {
			if (error) { return callback(error); }
			if (this.data.users && this.user) {
				this.data.users.addModelToCache(this.user);
			}
			callback();
		});
	}

	// finish with this request
	finish (error) {
		// must execute the response phase, no matter what!
		if (
			error &&
			!this.responseIssued &&
			typeof this[this.RESPONSE_PHASE] === 'function'
		) {
			this.gotError = error;
			this[this.RESPONSE_PHASE](
				(error) => {
					if (error) {
						this.error('Error handling response: ' + error);
					}
				}
			);
		}
		if (error) {
			this.close();
		}
	}

	// fulfill the request
	fulfill () {
		this.responseIssued = false;
		// execute each phase of the request, aborting at any time on error
		BoundAsync.forEachSeries(
			this,
			this.REQUEST_PHASES,
			this.executePhase,
			this.finish,
			true
		);
	}

	deauthorize (error, statusCode) {
		this.statusCode = statusCode || 403;
		this.responseData = error || 'not authorized';
	}

	deauthorizePermanent (statusCode, error) {
		this.deauthorize(statusCode, error);
	}

	// default authorize function, authorize the request (which by default means forbidding the request, this function should be overridden!)
	authorize (callback) {
		// don't authorize by default, this must be overridden for proper ACL
		this.warn('Default ACL check fails, override authorize() method for this request: ' + this.request.method + ' ' +
			this.request.url);
		this.deauthorize();
		return callback(true);
	}

	// persist all database changes to the database
	persist (callback) {
		this.data.persist(callback);
	}

	// persist all database changes to the database, after the request has been fully processed
	postProcessPersist (callback) {
		// nothing different to do here
		this.persist(callback);
	}

	// handle the request response
	handleResponse (callback) {
		if (this.gotError) {
			return this.handleErrorResponse(callback);
		}
		this.statusCode = this.statusCode || 200;
		this.response.
			set('X-Request-Id', this.request.id).
			status(this.statusCode).
			send(this.responseData);
		process.nextTick(callback);
	}

	handleErrorResponse (callback) {
		if (!this.statusCode) {
			if (typeof this.gotError === 'object' && this.gotError.internal) {
				this.statusCode = 500;
			}
			else {
				this.statusCode = 403;
			}
		}
		this.warn(ErrorHandler.log(this.gotError));
		if (Object.keys(this.responseData).length === 0) {
			this.responseData = ErrorHandler.toClient(this.gotError);
		}
		this.response.status(this.statusCode).send(this.responseData);
		process.nextTick(callback);
	}

	close () {
		this.response.emit('complete');
		this.closed = true;
	}

	critical (text) {
		this.api.logger.critical(text, this.request.id);
	}

	error (text) {
		this.api.logger.error(text, this.request.id);
	}

	warn (text) {
		this.api.logger.warn(text, this.request.id);
	}

	log (text) {
		this.api.logger.log(text, this.request.id);
	}

	debug (text) {
		this.api.logger.debug(text, this.request.id);
	}
}

module.exports = APIRequest;
