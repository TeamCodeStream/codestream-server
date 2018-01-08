'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var PubNub = require('pubnub');
var PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
var PubNubClient = require(process.env.CS_API_TOP + '/lib/util/pubnub/pubnub_client.js');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Assert = require('assert');

class SubscriptionTest extends CodeStreamAPITest {

	get description () {
		return `user should be able to subscribe to the ${this.which} channel after they confirm registration`;
	}

	dontWantToken () {
		return true;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.registerUser,
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.confirm
		], callback);
	}

	registerUser (callback) {
		this.userFactory.registerRandomUser((error, response) => {
			if (error) { return callback(error); }
			this.user = response.user;
			callback();
		});
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				token: this.otherUserData.accessToken,
				withEmails: [this.user.email]
			}
		);
	}

	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				token: this.otherUserData.accessToken,
				type: 'direct',
				memberIds: [this.user._id],
				teamId: this.team._id
			}
		);
	}

	confirm (callback) {
		let data = {
			userId: this.user._id,
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

	run (callback) {
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

	createPubNubClient () {
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		let clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.user._id;
		clientConfig.authKey = this.token;
		let client = new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
