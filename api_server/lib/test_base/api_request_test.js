// Base class for unit tests conforming to an API request/response cycle

'use strict';

const GenericTest = require('./generic_test');
const HTTPSBot = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/https_bot');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Assert = require('assert');
const IPC = require('node-ipc');
const UUID = require('uuid').v4;
const DeepEqual = require('deep-equal');

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
			this.ipc.disconnect(this.apiConfig.apiServer.ipc.serverId);
		}
		super.after(callback);
	}

	readConfig (callback) {
		(async () => {
			if (!CodeStreamApiConfig) {
				CodeStreamApiConfig = await ApiConfig.loadPreferredConfig();
			}
			this.apiConfig = CodeStreamApiConfig;
			this.usingSocketCluster = this.apiConfig.broadcastEngine.selected === 'codestreamBroadcaster';
			callback();
		})();
	}

	// connect to IPC in mock mode
	connectToIpc (callback) {
		IPC.config.id = this.apiConfig.apiServer.ipc.clientId;
		IPC.config.silent = true;
		IPC.connectTo(this.apiConfig.apiServer.ipc.serverId, () => {
			IPC.of[this.apiConfig.apiServer.ipc.serverId].on('response', this.handleIpcResponse.bind(this));
		});
		this.ipc = IPC;
		callback();
	}

	// are we connected to IPC?
	connectedToIpc () {
		return (
			this.ipc &&
			this.ipc.of[this.apiConfig.apiServer.ipc.serverId]
		);
	}

	// the guts of making an API server request
	doApiRequest (options = {}, callback = null) {
		let requestOptions = Object.assign({}, options.requestOptions || {});
		requestOptions.rejectUnauthorized = false;	// avoid complaints about security
		this.makeHeaderOptions(options, requestOptions);

		const host = process.env.CS_API_TEST_SERVER_HOST || this.apiConfig.apiServer.publicApiUrlParsed.host;
		const port = process.env.CS_API_TEST_SERVER_PORT || (process.env.CS_API_TEST_SERVER_HOST && "443") || this.apiConfig.apiServer.port;
		const method = options.method || 'get';
		const path = options.path || '/';
		const data = options.data || null;
		const start = Date.now();
		const requestCallback = function(error, responseData, response) {
			const requestId = (response && response.headers['x-request-id']) || '???';
			const statusCode = (response && response.statusCode) || '???';
			const result = error ? 'FAIL' : 'OK';
			const end = Date.now();
			const took = end - start; 
			this.testLog(`${requestId} ${method} ${path} ${result} ${statusCode} ${took}ms:\n${JSON.stringify(responseData, 0, 10)}\n`);
			callback(error, responseData, response);
		}.bind(this);
		if (this.mockMode) {
			this.sendIpcRequest({
				method,
				path,
				data,
				headers: requestOptions.headers
			}, requestCallback, requestOptions);

		}
		else {
			HTTPSBot[method](
				host,
				port,
				path,
				data,
				requestOptions,
				requestCallback
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
		this.ipc.of[this.apiConfig.apiServer.ipc.serverId].emit('request', message);
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
		if (!options.reallyDoCrossEnvironment) {
			// since we're just doing testing, block doing cross-environment stuff
			requestOptions.headers['X-CS-Block-XEnv'] = true;
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
		requestOptions.headers['X-CS-Test-Num'] = `API-${this.testNum}`;	// makes it easy to log requests associated with particular tests
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
		if (!DeepEqual(objectIds_1, objectIds_2)) {
			Assert.fail(`${name} returned don't match`);
		}
		//Assert.deepStrictEqual(objectIds_2, objectIds_1, `${name} returned don't match`);
	}

	// check that the objects we got back match expections, sorted by ID
	validateMatchingObjectsSorted (objects1, objects2, name) {
		let objectIds_1 = objects1.map(object => object.id);
		let objectIds_2 = objects2.map(object => object.id);
		Assert.deepStrictEqual(objectIds_2, objectIds_1, `${name} returned don't match`);
	}

	// check that the objects we got back exactly match expectations
	validateSortedMatchingObjects(objects1, objects2, name) {
		Assert.deepStrictEqual(objects2, objects1, `${name} returned don't match`);
	}
}

module.exports = APIRequestTest;
