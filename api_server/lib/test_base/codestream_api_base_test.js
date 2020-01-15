// Base class for unit tests conforming to an API request/response cycle

'use strict';

const BaseTest = require('./base_test');
const HTTPSBot = require(process.env.CS_API_TOP + '/server_utils/https_bot');
const ExpressConfig = require(process.env.CS_API_TOP + '/config/express');
const Assert = require('assert');
const IpcConfig = require(process.env.CS_API_TOP + '/config/ipc');
const IPC = require('node-ipc');
const UUID = require('uuid/v4');
const UserFactory = require(process.env.CS_API_TOP + '/modules/users/test/user_factory');
const TeamFactory = require(process.env.CS_API_TOP + '/modules/teams/test/team_factory');
const TestDataCreator = require('./test_data_creator');
/*
const RandomRepoFactory = require(process.env.CS_API_TOP + '/modules/repos/test/random_repo_factory');
const RandomStreamFactory = require(process.env.CS_API_TOP + '/modules/streams/test/random_stream_factory');
const RandomPostFactory = require(process.env.CS_API_TOP + '/modules/posts/test/random_post_factory');
const RandomMarkerFactory = require(process.env.CS_API_TOP + '/modules/markers/test/random_marker_factory');
const RandomCodemarkFactory = require(process.env.CS_API_TOP + '/modules/codemarks/test/random_codemark_factory');
*/

var DATA;

class CodeStreamAPIBaseTest extends BaseTest {

	constructor (options) {
		super(options);
		this.ipcRequestInfo = {};

		// set up factories to generate various test objects for us
		this.userFactory = new UserFactory({
			apiRequester: this
		});
		this.teamFactory = new TeamFactory({
			apiRequester: this,
			userFactory: this.userFactory
		});
		/*
		this.repoFactory = new RandomRepoFactory({
			apiRequester: this,
			teamFactory: this.teamFactory,
			userFactory: this.userFactory
		});
		this.streamFactory = new RandomStreamFactory({
			apiRequester: this
		});
		this.markerFactory = new RandomMarkerFactory({
			apiRequester: this,
			repoFactory: this.repoFactory,
			streamFactory: this.streamFactory
		});
		this.codemarkFactory = new RandomCodemarkFactory({
			apiRequester: this,
			markerFactory: this.markerFactory
		});
		this.postFactory = new RandomPostFactory({
			apiRequester: this,
			streamFactory: this.streamFactory,
			repoFactory: this.repoFactory,
			codemarkFactory: this.codemarkFactory
		});
		*/
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

	async before () {
		if (this.mockMode) {
			this.connectToIpc();
		}
		await super.before();
		if (!DATA) {
			DATA = await new TestDataCreator({ test: this }).create();
		}
		this.data = DATA;
		if (typeof this.currentUserIndex === 'number') {
			this.currentUser = this.data.users[this.currentUserIndex];
			this.token = this.currentUser.accessToken;
		}
	}

	async after () {
		if (
			this.mockMode &&
			!this.testDidNotRun
		) {
			await this.clearMockCache();
		}
		if (this.ipc) {
			this.ipc.disconnect(IpcConfig.serverId);
		}
	}

	// clears the local cache that simulates mongo data
	async clearMockCache () {
		if (!this.connectedToIpc()) { 
			return;
		}
		await this.doApiRequest(
			{
				method: 'delete',
				path: '/no-auth/--clear-mock-cache'
			}
		);
	}

	// connect to IPC in mock mode
	connectToIpc () {
		IPC.config.id = IpcConfig.clientId;
		IPC.config.silent = true;
		IPC.connectTo(IpcConfig.serverId, () => {
			IPC.of[IpcConfig.serverId].on('response', this.handleIpcResponse.bind(this));
		});
		this.ipc = IPC;
	}

	// are we connected to IPC?
	connectedToIpc () {
		return (
			this.ipc &&
			this.ipc.of[IpcConfig.serverId]
		);
	}

	// the guts of making an API server request
	doApiRequest (options = {}) {
		let requestOptions = Object.assign({}, options.requestOptions || {});
		requestOptions.rejectUnauthorized = false;	// avoid complaints about security
		this.makeHeaderOptions(options, requestOptions);

		const method = options.method || 'get';
		const path = options.path || '/';
		const data = options.data || null;
		return new Promise((resolve, reject) => {
			const resolveFn = (error, response, httpResponse) => {
				if (options.responseOutput) {
					options.responseOutput.response = response;
					options.responseOutput.httpResponse = httpResponse;
				}
				if (error) {
					return reject(error);
				}
				resolve(response);
			};
			try {
				if (this.mockMode) {
					this.sendIpcRequest(
						{
							method,
							path,
							data,
							headers: requestOptions.headers
						}, resolveFn, requestOptions);
				}
				else {
					HTTPSBot[method](
						ExpressConfig.host,
						ExpressConfig.port,
						path,
						data,
						requestOptions,
						resolveFn
					);
				}
			}
			catch (error) {
				reject(error);
			}
		});
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
		this.ipc.of[IpcConfig.serverId].emit('request', message);
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
	async apiRequest (options = {}) {
		const responseOutput = { };
		let response, error;
		try {
			response = await this.doApiRequest(
				Object.assign({}, options, {
					method: this.method,
					path: this.path,
					data: this.requestData,
					requestOptions: this.apiRequestOptions || {},
					token: this.ignoreTokenOnRequest ? null : this.token,
					responseOutput
				})
			);
		}
		catch (e) {
			error = e;
			response = responseOutput.response;
		}
		this.httpResponse = responseOutput.httpResponse;
		await this.checkResponse(error, response);
	}

	// run the test by initiating the request/response cycle
	async run (options = {}) {
		return this.apiRequest(options);
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
		objects1.forEach(object => {
			Assert.equal(object._id, object.id, 'an object\'s _id is not set to id');	// DEPRECATE ME
		});
	}

	// check that the objects we got back exactly match expectations
	validateSortedMatchingObjects(objects1, objects2, name) {
		Assert.deepEqual(objects2, objects1, `${name} returned don't match`);
		objects1.forEach(object => {
			Assert.equal(object._id, object.id, 'an object\'s _id is not set to id');	// DEPRECATE ME
		});
	}

	// validate that the object passed is sanitized of server-only attributes,
	// according to the list of attributes that should be sanitized away
	validateSanitized (object, unsanitizedAttributes) {
		let present = [];
		let objectAttributes = Object.keys(object);
		unsanitizedAttributes.forEach(attribute => {
			if (objectAttributes.includes(attribute)) {
				present.push(attribute);
			}
		});
		Assert(present.length === 0, 'these attributes are present and shouldn\'t be: ' + present.join(','));
	}

	// validate that the passed objects are sanitized of server-only attributes,
	// according to the list of attributes that should be sanitized away
	validateSanitizedObjects (objects, unsanitizedAttributes) {
		objects.forEach(object => {
			this.validateSanitized(object, unsanitizedAttributes);
		});
	}


}

module.exports = CodeStreamAPIBaseTest;
