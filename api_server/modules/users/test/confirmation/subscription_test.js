'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var PubNub = require('pubnub');
var PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
var PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client.js');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Assert = require('assert');

class SubscriptionTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
	}

	get description () {
		return `user should be able to subscribe to the ${this.which} channel after they confirm registration`;
	}

	dontWantToken () {
		return true;	// don't need a registered user with an access token for this test
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,		// run standard test setup
			this.registerUser,	// register a user (but don't confirm)
			this.createOtherUser,	// create a registered user
			this.createRepo,		// have the registered user create a repo (and team)
			this.createStream,		// have the registered user create a stream in the team
			this.confirm 			// the registered user (but not confirmed) now confirms
		], callback);
	}

	// register a user (but don't confirm) ... we'll confirm later
	registerUser (callback) {
		this.userFactory.registerRandomUser((error, response) => {
			if (error) { return callback(error); }
			this.user = response.user;
			callback();
		});
	}

	// create a registred user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// have the registered user create a repo and team
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				token: this.otherUserData.accessToken,	// registered user is the repo and team creator
				withEmails: [this.user.email]			// include the still-unconfirmed user in the team
			}
		);
	}

	// have the registered user create a stream in the team
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				token: this.otherUserData.accessToken,	// registered user creates the stream
				type: 'direct',							// direct stream...
				memberIds: [this.user._id],				// ...with the still-unconfirmed user in the stream
				teamId: this.team._id
			}
		);
	}

	// confirm the user, this gives us an access token and allows us to subscribe to the channel of interest
	confirm (callback) {
		// make the confirmation request to get the access token
		let data = {
			email: this.user.email,
			confirmationCode: this.user.confirmationCode
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.token = response.accessToken;
				callback();
			}
		);
	}

	// run the actual test...
	run (callback) {
		// create a pubnub client and attempt to subscribe to the channel of interest
		let pubNubClient = this.createPubNubClient();
		let channel = `${this.which}-${this[this.which]._id}`;
		pubNubClient.subscribe(
			channel,
			() => {},
			error => {
				Assert.ifError(error, `error subscribing to ${channel}`);
				callback();
			}
		);
	}

	// create a pubnub client, through which we'll attempt to subscribe to the channel of interest
	createPubNubClient () {
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		let clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.user._pubnubUuid || this.user._id;
		clientConfig.authKey = this.token;	// the access token is the auth key for the subscription
		let client = new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
