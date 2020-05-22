// Base class for unit tests conforming to an API request/response cycle

'use strict';

const GenericTest = require('./generic_test');
const HTTPSBot = require(process.env.CS_API_TOP + '/server_utils/https_bot');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config');
const Assert = require('assert');
const IPC = require('node-ipc');
const UUID = require('uuid/v4');

var CodeStreamApiConfig;

class APIRequestTest extends GenericTest {

	constructor (options) {
		super(options);
		this.ipcRequestInfo = {};
	}

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

	before (callback) {
		this.readConfig(error => {
			if (error) { return callback(error); }
			if (this.mockMode) {
				this.connectToIpc(callback);
			}
			else {
				callback();
			}
		});
	}

	after (callback) {
		if (this.ipc) {
			this.ipc.disconnect(this.apiConfig.ipc.serverId);
		}
		super.after(callback);
	}

	readConfig (callback) {
		(async () => {
			if (!CodeStreamApiConfig) {
				CodeStreamApiConfig = await ApiConfig.loadPreferredConfig();
			}
			this.apiConfig = CodeStreamApiConfig;
			this.usingSocketCluster = this.apiConfig.whichBroadcasterEngine === 'codestreamBroadcaster';
			callback();
		})();
	}

	// connect to IPC in mock mode
	connectToIpc (callback) {
		IPC.config.id = this.apiConfig.ipc.clientId;
		IPC.config.silent = true;
		IPC.connectTo(this.apiConfig.ipc.serverId, () => {
			IPC.of[this.apiConfig.ipc.serverId].on('response', this.handleIpcResponse.bind(this));
		});
		this.ipc = IPC;
		callback();
	}

	// are we connected to IPC?
	connectedToIpc () {
		return (
			this.ipc &&
			this.ipc.of[this.apiConfig.ipc.serverId]
		);
	}

	// the guts of making an API server request
	doApiRequest (options = {}, callback = null) {
		let requestOptions = Object.assign({}, options.requestOptions || {});
		requestOptions.rejectUnauthorized = false;	// avoid complaints about security
		this.makeHeaderOptions(options, requestOptions);

		const method = options.method || 'get';
		const path = options.path || '/';
		const data = options.data || null;
		if (this.mockMode) {
			this.sendIpcRequest({
				method,
				path,
				data,
				headers: requestOptions.headers
			}, callback, requestOptions);

		}
		else {
			HTTPSBot[method](
				this.apiConfig.express.host,
				this.apiConfig.express.port,
				path,
				data,
				requestOptions,
				callback
			);
		}
	}

	// send an API server request over IPC, for mock mode
	sendIpcRequest (options, callback, requestOptions = {}) {
		const clientRequestId = UUID();
		const message = {
			method: options.method,
			path: options.path,
			headers: options.headers,
			clientRequestId
		};
		if (options.method === 'get') {
			message.query = options.data;
		}
		else {
			message.body = options.data;
		}
		this.ipcRequestInfo[clientRequestId] = {
			callback,
			options: requestOptions
		};
		this.ipc.of[this.apiConfig.ipc.serverId].emit('request', message);
	}

	// handle a request response over IPC, for mock mode
	handleIpcResponse (response) {
		const info = this.ipcRequestInfo[response.clientRequestId];
		if (!info) { return; }
		const { options, callback } = info;
		delete this.ipcRequestInfo[response.clientRequestId];
		response.headers = Object.keys(response.headers || {}).reduce((headers, headerKey) => {
			headers[headerKey.toLowerCase()] = response.headers[headerKey];
			return headers;
		}, {});
		if (response.statusCode < 200 || response.statusCode >= 300) {
			if (
				options.expectRedirect &&
				response.statusCode >= 300 &&
				response.statusCode < 400
			) {
				return callback(null, response.headers.location, response);
			}
			else {
				return callback(`error response, status code was ${response.statusCode}`, response.data, response);
			}
		}
		else {
			return callback(null, response.data, response);
		}
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
			// since we're just doing testing, block actual messages from going out over the broadcaster
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
		if (options.trackOnChannel) {
			// if a special channel is specified for tracking testing, use that
			requestOptions.headers['X-CS-Track-Channel'] = options.trackOnChannel;
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
			(error, response, httpResponse) => {
				this.httpResponse = httpResponse;
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
		Assert(id === object.id, `${name} doesn't match`);
		Assert(id === object._id, `_id in ${name} is not set to id`);	// DEPRECATE ME
	}

	// check that the objects we got back match expections, by ID
	validateMatchingObjects (objects1, objects2, name) {
		let objectIds_1 = objects1.map(object => object.id).sort();
		let objectIds_2 = objects2.map(object => object.id).sort();
		Assert.deepEqual(objectIds_2, objectIds_1, `${name} returned don't match`);
	}

	// check that the objects we got back match expections, sorted by ID
	validateMatchingObjectsSorted (objects1, objects2, name) {
		let objectIds_1 = objects1.map(object => object.id);
		let objectIds_2 = objects2.map(object => object.id);
		Assert.deepEqual(objectIds_2, objectIds_1, `${name} returned don't match`);
	}

	// check that the objects we got back exactly match expectations
	validateSortedMatchingObjects(objects1, objects2, name) {
		Assert.deepEqual(objects2, objects1, `${name} returned don't match`);
	}
}

module.exports = APIRequestTest;
