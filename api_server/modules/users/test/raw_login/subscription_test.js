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
		return `user should be able to subscribe to the ${this.which} channel after they login using access token`;
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createTeam,		// have the second registered user create a team
			this.inviteCurrentUser,	// have the second registered user invite the "current user" to the team
			this.createStream,		// have the second registered user create a stream in the team
			this.login,	 			// the "current" user now logs in
			this.wait				// wait a bit for the permissions to be granted
		], callback);
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

	// have the second registered user create a team
	createTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				token: this.otherUserData.accessToken	// second registered user is the team creator
			}
		);
	}

	// have the second registered user invite the "current user" to the team
	inviteCurrentUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.team._id,
					email: this.currentUser.email
				},
				token: this.otherUserData.accessToken
			},
			callback
		);
	}


	// have the second registered user create a stream in the team, with the current user 
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				token: this.otherUserData.accessToken,	// second registered user creates the stream
				type: 'channel',						// channel stream...
				memberIds: [this.currentUser._id],		// ...with the "current" user as a member
				teamId: this.team._id
			}
		);
	}

	// the "current" user now logs in, this should grant access to the expected channel
	login (callback) {
		// make the login request 
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				data: {},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.user = this.currentUser;
				this.pubnubToken = response.pubnubToken;
				callback();
			}
		);
	}

	// wait a bit for the permissions to be granted
	wait (callback) {
		setTimeout(callback, 2000);
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
		clientConfig.uuid = this.currentUser._pubnubUuid || this.currentUser._id;
		clientConfig.authKey = this.pubnubToken;	// the PubNub token is the auth key for the subscription
		let client = new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
