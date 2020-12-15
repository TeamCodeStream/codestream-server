// base class for all incoming requests
// this class provides the basis for the flow of a typical request, from initialization to authorization to processing
// to data persistence, etc.

'use strict';

const APIRequestData = require('./api_request_data');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');

class APIRequest {

	constructor (options = {}) {
		Object.assign(this, options);
		this.responseIssued = false;			// this gets set when once the response has been issued
		this.responseData = {};					// prepare for any response data to be put in here
		this.transforms = {};					// prepare for any transforms by the request to be put in here
		this.data = new APIRequestData({		// wrapper for all collections relevant to this request
			api: this.api,
			request: this.request
		});
		this.user = this.request.user;			// current user
		this._setRequestPhases();
	}

	// Default requests have at least these phases
	// Derived requests can override this behavior either by overriding the method in question or by changing the
	// whole structure of the request ... for consistency it is recommended to change the structure only when necessary to
	// suit a specialized application ... in general this structure should work very well for the vast majority of requests
	_setRequestPhases () {

		this.REQUEST_PHASES = [
			// initializion of data
			'initialize',
			// a priori authorization of the request (ACL)
			'authorize',
			// process the request, this is the meat of it
			'process',
			// any changes are written to the database here
			'persist',
			// send the response back to the client
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
	async executePhase (phase) {
		if (typeof this[phase] !== 'function') {
			return;
		}
		await this[phase]();
		if (phase === this.RESPONSE_PHASE) {
			this.responseIssued = true;
		}
	}

	// initialize the request
	async initialize () {
		if (this.request.abortWith) {
			// middleware error
			this.statusCode = this.request.abortWith.status;
			throw this.request.abortWith.error;
		}
		this.request.keepOpen = true;
		await this.makeData();
	}

	// make the local data cache for this request
	async makeData () {
		await this.data.makeData();
		if (this.data.users && this.user) {
			// if we've authenticated the request and matched to a user,
			// we can add that user to the cache here
			this.data.users.addModelToCache(this.user);
		}
	}

	// finish with this request
	async finish (error) {
		// must execute the response phase, no matter what!
		if (
			error &&
			!this.responseIssued &&
			typeof this[this.RESPONSE_PHASE] === 'function'
		) {
			this.gotError = error;
			try {
				await this[this.RESPONSE_PHASE]();
			}
			catch (responsePhaseError) {
				if (responsePhaseError) {
					this.error('Error handling response: ' + responsePhaseError);
				}
			}
		}
		else if (error) {
			this.warn(ErrorHandler.log(error));
		}
		if (error) {
			this.close();
		}
	}

	// fulfill the request
	async fulfill () {
		this.responseIssued = false;
		// execute each phase of the request, aborting at any time on error
		let gotError;
		for (let i in this.REQUEST_PHASES) {
			const phase = this.REQUEST_PHASES[i];
			try {
				await this.executePhase(phase);
			}
			catch (error) {
				gotError = error;
				break;
			}
		}
		await this.finish(gotError);
	}

	// deauthorize this request by sending a 403 (or other status code explicitly set by the request)
	deauthorize (error, statusCode) {
		this.statusCode = statusCode || 403;
		this.responseData = error || 'not authorized'; // set the response to the error
	}

	// default authorize function, authorize the request (which by default means forbidding the request, this function should be overridden!)
	async authorize () {
		// don't authorize by default, this must be overridden for proper ACL
		this.warn(`Default ACL check fails, override authorize() method for this request: ${this.request.method} ${this.request.url}`);
		this.deauthorize();
		throw true;
	}

	// persist all database changes to the database
	async persist () {
		await this.data.persist();
	}

	// persist all database changes to the database, after the request has been fully processed
	async postProcessPersist () {
		// nothing different to do here
		await this.persist();
	}

	// handle the request response
	async handleResponse () {
		if (this.gotError) {
			return await this.handleErrorResponse();
		}
		else if (this.responseHandled) {
			return;
		}
		this.statusCode = this.statusCode || 200;
		this.response.
			set('X-Request-Id', this.request.id).
			status(this.statusCode).
			send(this.responseData);
	}

	// handle an error that occurred during the request processing
	async handleErrorResponse () {
		if (!this.statusCode) {
			if (
				(this.gotError && !this.gotError.code) ||
				(typeof this.gotError === 'object' && this.gotError.internal)
			) {
				this.statusCode = 500; // internal errors get a 500
			}
			else {
				this.statusCode = 403; // others get a 403
			}
		}
		this.warn(ErrorHandler.log(this.gotError));
		this.responseData = ErrorHandler.toClient(this.gotError);
		this.response.set('X-Request-Id', this.request.id);
		this.response.status(this.statusCode).send(this.responseData);
	}

	// close out this request
	async close () {
		if (this.response) {
			this.response.emit('complete');
		}
		this.closed = true;
	}

	// does this request have a "for testing" header?
	isForTesting () {
		return !!(
			this.request &&
			this.request.headers &&
			this.request.headers['x-cs-test-num']
		);
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
