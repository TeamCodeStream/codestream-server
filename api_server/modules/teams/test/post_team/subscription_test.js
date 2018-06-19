'use strict';

const PubNub = require('pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client.js');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');

// a class to check if the user gets subscribed to the team channel when a team is created
class SubscriptionTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
	}

	get description () {
		return 'user should be able to subscribe to the team channel when they create a new team';
	}

	// before the test runs...
	before (callback) {
		// create the team, the test is trying to subscribe to the team channel
		this.createTeam(callback);
	}

	// create a new team
	createTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				token: this.token
			}
		);
	}

	// run the test
	run (callback) {
		// create a pubnub client and attempt to subscribe to the team channel
		const pubNubClient = this.createPubNubClient();
		const channel = `team-${this.team._id}`;
		pubNubClient.subscribe(
			channel,
			() => {},
			error => {
				Assert.ifError(error, `error subscribing to ${channel}`);
				callback();
			}
		);
	}

	// create a pubnub client for the test
	createPubNubClient () {
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		let clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.currentUser._pubnubUuid || this.currentUser._id;
		clientConfig.authKey = this.token;
		let client = new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
