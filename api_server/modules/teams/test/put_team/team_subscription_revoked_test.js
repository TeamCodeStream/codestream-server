'use strict';

const PutTeamTest = require('./put_team_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const PubNub = require('pubnub');
const MockPubnub = require(process.env.CS_API_TOP + '/server_utils/pubnub/mock_pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const IpcConfig = require(process.env.CS_API_TOP + '/config/ipc');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client_async');
const SocketClusterConfig = require(process.env.CS_API_TOP + '/config/socketcluster');
const SocketClusterClient = require(process.env.CS_API_TOP + '/server_utils/socketcluster/socketcluster_client');

class TeamSubscriptionRevokedTest extends PutTeamTest {

	constructor (options) {
		super(options);
		this.usingSocketCluster = SocketClusterConfig.port;
	}

	get description () {
		return 'users removed from a team should no longer be able to subscribe to the team channel for that team';
	}

	after (callback) {
		this.messagerClient.unsubscribeAll();
		this.messagerClient.disconnect();
		super.after(callback);
	}

	// run the actual test...
	run (callback) {
		// do the normal test, removing the current user, but afterwards try to
		// subscribe to the team channel, which should fail
		BoundAsync.series(this, [
			super.run,
			this.makeMessagerClient,
			this.trySubscribeToTeam
		], callback);
	}

	async makeMessagerClient (callback) {
		// create a pubnub client and attempt to subscribe to the team channel
		this.messagerClient = this.createMessagerClient();
		this.messagerClient.init();
		callback();
	}

	createMessagerClient () {
		if (this.usingSocketCluster) {
			return this.createSocketClusterClient();
		}
		else {
			return this.createPubnubClient();
		}
	}

	createSocketClusterClient () {
		const config = Object.assign({}, SocketClusterConfig, {
			uid: this.users[1].user.id,
			authKey: this.users[1].pubnubToken 
		});
		return new SocketClusterClient(config);
	}

	createPubnubClient () { 
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		const clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.users[1].user._pubnubUuid || this.users[1].user.id;
		clientConfig.authKey = this.users[1].pubnubToken;
		if (this.mockMode) {
			clientConfig.ipc = this.ipc;
			clientConfig.serverId = IpcConfig.serverId;
		}
		let client = this.mockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}

	// form the data for the team update
	makeTeamData (callback) {
		// remove another user from the team, that user will then try to subscribe
		super.makeTeamData(() => {
			this.data.$pull = {
				memberIds: this.users[1].user.id
			};
			this.expectedData.team.$pull = {
				memberIds: [this.users[1].user.id],
				adminIds: [this.users[1].user.id]
			};
			callback();
		});
	}

	// try to subscribe to the team channel
	async trySubscribeToTeam (callback) {
		try {
			await this.messagerClient.subscribe(
				`team-${this.team.id}`,
				() => {
					Assert.fail('message received on team channel');
				}
			);
			Assert.fail('subscription to team channel was successful');
		} 
		catch (error) {
			callback();
		}
	}
}

module.exports = TeamSubscriptionRevokedTest;
