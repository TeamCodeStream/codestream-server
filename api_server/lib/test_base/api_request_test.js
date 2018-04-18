// Base class for unit tests conforming to an API request/response cycle

'use strict';

var GenericTest = require('./generic_test');
var HTTPSBot = require(process.env.CS_API_TOP + '/server_utils/https_bot');
var ExpressConfig = require(process.env.CS_API_TOP + '/config/express');
var Assert = require('assert');

class APIRequestTest extends GenericTest {

	get method () {
		return this._method || 'get';
	}

	set method (method) {
		this._method = method;
	}

	get path () {
		return this._path || '/';
	}

	set path (path) {
		this._path = path;
	}

	// the guts of making an API server request
	doApiRequest (options = {}, callback = null) {
		let requestOptions = Object.assign({}, options.requestOptions || {});
		requestOptions.rejectUnauthorized = false;	// avoid complaints about security
		this.makeHeaderOptions(options, requestOptions);

		const method = options.method || 'get';
		const path = options.path || '/';
		const data = options.data || null;
		HTTPSBot[method](
			ExpressConfig.host,
			ExpressConfig.port,
			path,
			data,
			requestOptions,
			callback
		);
	}

	// make header options to go out with the API request
	makeHeaderOptions (options, requestOptions) {
		requestOptions.headers = Object.assign({}, requestOptions.headers || {});
		if (options.token) {
			// use this token in the request
			requestOptions.headers.Authorization = 'Bearer ' + options.token;
		}
		if (!options.reallySendEmails) {
			// since we're just doing testing, block actual emails from going out
			requestOptions.headers['X-CS-Block-Email-Sends'] = true;
		}
		if (!options.reallySendMessages && !this.reallySendMessages) {
			// since we're just doing testing, block actual messages from going out over the messager
			requestOptions.headers['X-CS-Block-Message-Sends'] = true;
		}
		if (!options.reallyTrack) {
			// since we're just doing testing, block analytics tracking
			requestOptions.headers['X-CS-Block-Tracking'] = true;
		}
		if (!options.reallySendBotOut) {
			// since we're just doing testing, block sending bot messages
			requestOptions.headers['X-CS-Block-Bot-Out'] = true;
		}
		if (options.testEmails) {
			// we're doing email testing, block them from being sent but divert contents
			// to a pubnub channel that we'll listen on
			requestOptions.headers['X-CS-Test-Email-Sends'] = true;
		}
		if (options.testTracking) {
			// we're doing analytics tracking testing, block the tracking from being sent
			// but divert contents to a pubnub channel that we'll listen on
			requestOptions.headers['X-CS-Test-Tracking'] = true;
		}
		if (options.testBotOut) {
			// we're doing testing of bot messages going out, divert messages to the
			// bot to a pubnub channel that we'll listen on
			requestOptions.headers['X-CS-Test-Bot-Out'] = true;
		}
		requestOptions.headers['X-CS-For-Testing'] = true;	// makes it easy to wipe test data later on
	}

	// make an API requet, and check the response for validity
	apiRequest (callback, options = {}) {
		this.doApiRequest(
			Object.assign({}, options, {
				method: this.method,
				path: this.path,
				data: this.data,
				requestOptions: this.apiRequestOptions || {},
				token: this.ignoreTokenOnRequest ? null : this.token
			}),
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	// run the test by initiating the request/response cycle
	run (callback, options = {}) {
		this.apiRequest(callback, options);
	}

	// check that the object we got back matches expectation, assuming ID
	validateMatchingObject (id, object, name) {
		Assert(id.toString() === object._id.toString(), `${name} doesn't match`);
	}

	// check that the objects we got back match expections, by ID
	validateMatchingObjects (objects1, objects2, name) {
		let objectIds_1 = objects1.map(object => object._id).sort();
		let objectIds_2 = objects2.map(object => object._id).sort();
		Assert.deepEqual(objectIds_2, objectIds_1, `${name} returned don't match`);
	}

	// check that the objects we got back exactly match expectations
	validateSortedMatchingObjects(objects1, objects2, name) {
		Assert.deepEqual(objects2, objects1, `${name} returned don't match`);
	}
}

module.exports = APIRequestTest;
