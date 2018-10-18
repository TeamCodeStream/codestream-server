'use strict';

const BoundAsync = require(process.env.CS_MAILIN_TOP +'/server_utils/bound_async');
const RandomString = require('randomstring');
const Secrets = require(process.env.CS_MAILIN_TOP + '/config/secrets');
const HTTPSBot = require(process.env.CS_MAILIN_TOP + '/server_utils/https_bot');
const APIConfig = require(process.env.CS_MAILIN_TOP + '/config/api');
const InboundEmailConfig = require(process.env.CS_MAILIN_TOP + '/config/inbound_email');
const PubNubConfig = require(process.env.CS_MAILIN_TOP + '/config/pubnub');
const PubNub = require('pubnub');
const PubNubClient = require(process.env.CS_MAILIN_TOP + '/server_utils/pubnub/pubnub_client');
const FS = require('fs');
const Assert = require('assert');
const Path = require('path');

// We use a pool of UUIDs for interacting with PubNub during unit testing ...
// this is to avoid using the actual IDs of the users we are creating, which would
// mean a new UUID for every created user, every time ... since we are billed per
// user, that would be bad...
let _NextPubnubUuid = 0;

class EmailTest {

	constructor (options) {
		Object.assign(this, options);
	}

	get it () {
		if (this.shouldFail) {
			return `should not create a post from ${this.description}`
		}
		else {
			return `should create a post originating from ${this.description}`
		}
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.makeData,			// make some API calls to set up the data to use in the test
			this.makePubNubClient,	// make a pubnub client to listen for the post that should result
			this.readEmailFile,		// read in the email file for the test
			this.makeSubstitutions,	// make field substitutions for the users we've created into the email file
			this.wait				// wait a bit for permission grants to propagate
		], callback);
	}

	// run the actual test...
	run (callback) {
		BoundAsync.series(this, [
			this.listenOnClient,	// start listening first, expecting a post
			this.writeEmailFile,	// write the email file, this will trigger the message
			this.waitForMessage,		// wait for the message to arrive
			this.clearTimer			// clear the wait timer
		], callback);
	}

	// make some API calls to set up the data to use in the test
	makeData (callback) {
		BoundAsync.series(this, [
			this.createUsers,	// create a couple users, one will originate the post (the email is "from" that user), the other will listen
			this.createTeam,	// create a team 
			this.inviteOtherUser,	// invite the second user to the team
			this.createStream	// create a channel stream in the team
		], callback);
	}

	// create two users for running the test, one who will originate the post (the email is "from" them),
	// the other will listen for the post on pubnub
	createUsers (callback) {
		this.userData = [];
		BoundAsync.timesSeries(
			this,
			2,
			this.createUser,
			callback
		);
	}

	// create a single user for running the test
	createUser (n, callback) {
		BoundAsync.series(this, [
			this.registerUser,	// register the user
			this.confirmUser	// confirm the registration
		], callback);
	}

	// register a single user for running the test
	registerUser (callback) {
		let data = {
			email: this.randomEmail(),
			password: RandomString.generate(8),
			username: RandomString.generate(8),
			_confirmationCheat: Secrets.confirmationCheat
		};
		_NextPubnubUuid = (_NextPubnubUuid + 1) % 100;
		data._pubnubUuid = `TEST-UUID-${_NextPubnubUuid}`;
		this.apiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.userData.push(response);
				callback();
			}
		);
	}

	// confirm registration for a single user
	confirmUser (callback) {
		let userData = this.userData[this.userData.length - 1];
		let data = {
			email: userData.user.email,
			userId: userData.user._id,
			confirmationCode: userData.user.confirmationCode
		};
		this.apiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				Object.assign(userData, response);
				callback();
			}
		);
	}

	// create a team to use for the test
	createTeam (callback) {
		let data = {
			name: RandomString.generate(10)
		};
		this.apiRequest(
			{
				method: 'post',
				path: '/teams',
				data: data,
				token: this.userData[0].accessToken	// first user creates it
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			}
		);
	}

	// invite the second user to the team
	inviteOtherUser (callback) {
		let data = {
			teamId: this.team._id,
			email: this.userData[1].user.email
		};
		this.apiRequest(
			{
				method: 'post',
				path: '/users',
				data,
				token: this.userData[0].accessToken
			},
			callback
		);
	}

	// create a channel stream in the team
	createStream (callback) {
		let data = {
			type: 'channel',
			name: RandomString.generate(10),
			teamId: this.team._id,
			memberIds: [this.userData[1].user._id]
		};
		this.apiRequest(
			{
				method: 'post',
				path: '/streams',
				data: data,
				token: this.userData[0].accessToken	// first user creates the team
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			}
		);
	}

	// set up a pubnub client to listen for messages
	makePubNubClient (callback) {
		// the "second" user will listen for the post that should result from
		// processing the inbound email
		let clientConfig = Object.assign({}, PubNubConfig);
		let user = this.userData[1].user;
		clientConfig.uuid = user._pubnubUuid || user._id;
		clientConfig.authKey = this.userData[1].pubnubToken;
		let client = new PubNub(clientConfig);
		this.pubNubClient = new PubNubClient({
			pubnub: client
		});
		callback();
	}

	// read the email file indicated for the test
	readEmailFile (callback) {
		let path = Path.join(process.env.CS_MAILIN_TOP, 'test', 'test_files', this.emailFile);
		FS.readFile(
			path,
			'utf8',
			(error, emailData) => {
				if (error) { return callback(error); }
				this.emailData = emailData;
				callback();
			}
		);
	}

	// make substitutions into the file ... here we put in the from address as the
	// "first" user, making that user the one the email is simulated to be originating
	// from ... then for whatever "to" fields we want to test, we put in the appropriate
	// "reply-to" address for the stream and team
	makeSubstitutions (callback) {
		this.emailData = this.emailData.replace(/@@@from@@@/g, this.userData[0].user.email);
		let to = `${this.stream._id}.${this.team._id}@${InboundEmailConfig.replyToDomain}`;
		['to', 'cc', 'bcc', 'x-original-to', 'delivered-to'].forEach(field => {
			let regEx = new RegExp(`@@@${field}@@@`, 'g');
			this.emailData = this.emailData.replace(regEx, to);
		});
		callback();
	}

	// wait a bit, since access to the pubnub channel doesn't take effect immediately
	wait (callback) {
		setTimeout(callback, 5000);
	}

	// begin listening on the simulated client
	listenOnClient (callback) {
		// we'll time out after 10 seconds
		this.channelName = `stream-${this.stream._id}`;
		this.messageTimer = setTimeout(
			this.messageTimeout.bind(this, this.channelName),
			10000
		);

		// subscribe to the channel of interest
		this.pubNubClient.subscribe(
			this.channelName,
			this.messageReceived.bind(this),
			callback
		);
	}

	// called if message doesn't arrive after timeout
	messageTimeout (channel) {
		// if this test should fail (a post should not be generated), then this
		// timeout is actually what we want
		if (!this.shouldFail) {
			Assert.fail('message never arrived for ' + channel);
		}
		else {
			this.messageCallback();
		}
	}

	// called when a message has been received, assert that it matches expectations
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		if (message.channel !== this.channelName) {
			return;	// ignore
		}
		else if (!this.validateMessage(message.message)) {
			return; // ignore
		}

		// the message can actually arrive before we are waiting for it, so in that case signal that we already got it
		if (this.messageCallback) {
			this.messageCallback();
		}
		else {
			this.messageAlreadyReceived = true;
		}
	}

	// validate the message received against expectations
	validateMessage (message) {
		Assert.ifError(this.shouldFail);	// if this test should fail, we should not have recieved a message
		Assert(message.requestId, 'received message has no requestId');
		let post = message.post;
		Assert.equal(post.teamId, this.team._id, 'incorrect team ID');
		Assert.equal(post.streamId, this.stream._id, 'incorrect stream ID');
		Assert.equal(post.text, this.expectedText, 'text does not match');
		Assert.equal(post.creatorId, this.userData[0].user._id, 'creatorId is not the expected user');
		return true;
	}

	// write the email file to the inbound email directory, this is after we have
	// made field substitutions on it ... this should trigger the post getting created
	writeEmailFile (callback) {
		let path = Path.join(InboundEmailConfig.inboundEmailDirectory, this.emailFile);
		FS.writeFile(path, this.emailData, callback);
	}

	// wait for the post message to arrive
	waitForMessage (callback) {
		if (this.messageAlreadyReceived) {
			return callback();
		}
		else {
			this.messageCallback = callback;
			// do nothing until we get the message or a timeout...
		}
	}

	// after the test runs...
	clearTimer (callback) {
		// clean up the pubnub client, and cancel the message timer
		this.pubNubClient.unsubscribe(this.channelName);
		delete this.pubNubClient;
		if (this.messageTimer) {
			clearTimeout(this.messageTimer);
			delete this.messageTimer;
		}
		callback();
	}

	// generate a random email
	randomEmail () {
		return `somebody.${RandomString.generate(12)}@${RandomString.generate(12)}.com`;
	}

	// make a request to the api server
	apiRequest (options, callback) {
		options = Object.assign({}, options || {});
		options.headers = options.headers || {};
		if (options.token) {
			// use this token in the request
			options.headers.Authorization = 'Bearer ' + options.token;
		}
		options.rejectUnauthorized = false;	// avoid complaints about security

		// set several headers suppressing certain actions that we don't want triggered
		// during testing 
		options.headers['X-CS-Block-Email-Sends'] = true;
		options.headers['X-CS-Block-Tracking'] = true;
		options.headers['X-CS-Block-Bot-Out'] = true;
		options.headers['X-CS-For-Testing'] = true;	

		const method = options.method || 'get';
		const path = options.path || '/';
		const data = options.data || null;
		HTTPSBot[method](
			APIConfig.host,
			APIConfig.port,
			path,
			data,
			options,
			callback
		);
	}
};

module.exports = EmailTest;
