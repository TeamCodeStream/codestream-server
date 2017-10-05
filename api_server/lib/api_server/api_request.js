'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var API_Request_Data = require('./api_request_data');
var Error_Handler = require(process.env.CI_API_TOP + '/lib/util/error_handler');

class API_Request {

	constructor (options) {
		Object.assign(this, options);
		this.response_issued = false;						// this gets set when once the response has been issued
		this.response_data = {};							// prepare for any response data to be put in here
		this.data = new API_Request_Data({					// wrapper for all collections relevant to this request
			api: this.api,
			request: this.request
		});
		this.user = this.request.user;
		this._set_request_phases();
	}

	// Default requests have at least these phases:
	// Derived requests can override this behavior either by overriding the method in question or by changing the
	// whole structure of the request ... for consistency it is recommended to change the structure only when necessary to
	// suit a specialized application ... in general this structure should work very well for the vast majority of requests
	_set_request_phases () {

		this.REQUEST_PHASES = [
			// initializion of data
			'initialize',
			// deeper authorization of the request (ACL) which may involve a closer inspection of the details of the request,
			// including reading some data into the data cache
			'authorize',
			// normalize the request (set any default attributes, correct inconsistencies, etc)
			'normalize',
			// read any data needed to process the request, not that we can't read later, but it's good to front-load as much data
			// as possible so as not to pollute the processing phase with a bunch of database reads
			// from here on in we assume the process can do anything and everything, there is no deeper acl checking
			'read_initial_data',
			// process the request, this is the meat of it, we maintain a data cache that handles all the database soft-locking and
			// caching so nothing is retrieved from the database more than once and no objects are repeated, we maintain the touched
			// objects here as well
			'process',
			// any changes are written to the database here, we acquire a hard lock on the data and handle any version conflicts and merges
			'persist',
			// once the data has been successfully persisted it is sanitized such that it can be returned to the client, a separate
			// "sanitized" cache is maintained
			'sanitize',
			// send the response back to the client, along with any sanitized data
			'handle_response',
			// do any post-processing, meaning any processing of the request that goes on after the response is sent back to the client
			'post_process',
			// perform any additional persistence to the database, same as persist but here it is recognized that we have already sent
			// a response to the client
			'post_process_persist',
			// broadcast any and all additions/changes/deletions to listening clients
			'broadcast',
			// final cleanup
			'cleanup',
			// close the request
			'close'
		];

		// This indicates the phase that handles a response, this phase will get executed regardless of the output of other phases
		this.RESPONSE_PHASE = 'handle_response';
	}


	// execute a request phase
	execute_phase (phase, callback) {
		if (typeof this[phase] !== 'function') {
			return process.nextTick(callback);
		}
		this[phase]((error) => {
			if (!error && phase === this.RESPONSE_PHASE) {
				this.response_issued = true;
			}
			process.nextTick(() => {
				callback(error);
			});
		});
	}

	// initialize the request
	initialize (callback) {
		if (this.request.abort_with) {
			// middleware error
			this.status_code = this.request.abort_with.status;
			return callback(this.request.abort_with.error);
		}
		this.request.keep_open = true;
		this.make_data(callback);
	}

	make_data (callback) {
		this.data.make_data(callback);
	}

	// finish with this request
	finish (error) {
		// must execute the response phase, no matter what!
		if (
			error &&
			!this.response_issued &&
			typeof this[this.RESPONSE_PHASE] === 'function'
		) {
			this.got_error = error;
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
		this.response_issued = false;
		// execute each phase of the request, aborting at any time on error
		Bound_Async.forEachSeries(
			this,
			this.REQUEST_PHASES,
			this.execute_phase,
			this.finish,
			true
		);
	}

	deauthorize (error, status_code) {
		this.status_code = status_code || 403;
		this.response_data = error || 'not authorized';
	}

	deauthorize_permanent (status_code, error) {
		this.deauthorize(status_code, error);
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

	// sanitize manipulated data in anticipation of return to client or broadcast
	sanitize (callback) {
		process.nextTick(callback);
		// TODO 	this.data.sanitize(callback);
	}

	// persist all database changes to the database, after the request has been fully processed
	post_process_persist (callback) {
		// nothing different to do here
		this.persist(callback);
	}

	// handle the request response
	handle_response (callback) {
		if (this.got_error) {
			return this.handle_error_response(callback);
		}
		this.status_code = this.status_code || 200;
		this.response.status(this.status_code).send(this.response_data);
		process.nextTick(callback);
	}

	handle_error_response (callback) {
		if (!this.status_code) {
			if (typeof this.got_error === 'object' && this.got_error.internal) {
				this.status_code = 500;
			}
			else {
				this.status_code = 403;
			}
		}
		this.warn(Error_Handler.log(this.got_error));
		if (Object.keys(this.response_data).length === 0) {
			this.response_data = Error_Handler.to_client(this.got_error);
		}
		this.response.status(this.status_code).send(this.response_data);
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

module.exports = API_Request;
