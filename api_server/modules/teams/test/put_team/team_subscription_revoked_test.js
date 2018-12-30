'use strict';

const PutTeamTest = require('./put_team_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const PubNub = require('pubnub');
const MockPubnub = require(process.env.CS_API_TOP + '/server_utils/pubnub/mock_pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const IpcConfig = require(process.env.CS_API_TOP + '/config/ipc');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client');

class TeamSubscriptionRevokedTest extends PutTeamTest {

	get description () {
		return 'users removed from a team should no longer be able to subscribe to the team channel for that team';
	}

	after (callback) {
		this.pubnubClient.unsubscribeAll();
		super.after(callback);
	}

	// run the actual test...
	run (callback) {
		// do the normal test, removing the current user, but afterwards try to
		// subscribe to the team channel, which should fail
		BoundAsync.series(this, [
			super.run,
			this.trySubscribeToTeam
		], callback);
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
	trySubscribeToTeam (callback) {
		const clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.users[1].user._pubnubUuid || this.users[1].user.id;
		clientConfig.authKey = this.users[1].pubnubToken;
		if (this.mockMode) {
			clientConfig.ipc = this.ipc;
			clientConfig.serverId = IpcConfig.serverId;
		}
		const client = this.mockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		this.pubnubClient = new PubNubClient({
			pubnub: client
		});
		this.pubnubClient.init();
		this.pubnubClient.subscribe(
			`team-${this.team.id}`,
			() => {
				Assert.fail('message received on team channel');
			},
			error => {
				Assert(error, 'subscription to team channel was successful');
				callback();
			}
		);
	}
}

module.exports = TeamSubscriptionRevokedTest;
