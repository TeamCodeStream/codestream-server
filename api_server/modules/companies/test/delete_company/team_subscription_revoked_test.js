'use strict';

const DeleteCompanyTest = require('./delete_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const PubNub = require('pubnub');
const MockPubnub = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/mock_pubnub');
const PubNubClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/pubnub_client_async');
const SocketClusterClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/socketcluster/socketcluster_client');

class TeamSubscriptionRevokedTest extends DeleteCompanyTest {

	get description () {
		return 'users should no longer be able to subscribe to the team channel for a deleted team';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createSecondCompany
		], callback);
	}

	after (callback) {
		this.broadcasterClient.unsubscribeAll();
		this.broadcasterClient.disconnect();
		super.after(callback);
	}

	run (callback) {
		// do the normal test, removing the company, but afterwards try to
		// subscribe to the team channel, which should fail
		BoundAsync.series(this, [
			super.run,
			this.makeBroadcasterClient,
			this.trySubscribeToTeam
		], callback);
	}

	// we create a second company so that when we delete the first company,
	// our user isn't orphaned
	createSecondCompany (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.secondTeam = response.team;
				this.secondCompany = response.company;
				this.secondTeamStream = response.streams[0];
				callback();
			},
			{
				token: this.token
			}
		);
	}

	makeBroadcasterClient (callback) {
		// create a pubnub client and attempt to subscribe to the team channel
		this.broadcasterClient = this.createBroadcasterClient();
		(async () => {
			await this.broadcasterClient.init();
			callback();
		})();
	}

	createBroadcasterClient () {
		if (this.usingSocketCluster) {
			return this.createSocketClusterClient();
		}
		else {
			return this.createPubnubClient();
		}
	}

	createSocketClusterClient () {
		const broadcasterConfig = this.apiConfig.broadcastEngine.codestreamBroadcaster;
		const config = Object.assign({},
			{
				// formerly socketCluster object
				host: broadcasterConfig.host,
				port: broadcasterConfig.port,
				authKey: broadcasterConfig.secrets.api,
				ignoreHttps: broadcasterConfig.ignoreHttps,
				strictSSL: broadcasterConfig.sslCert.requireStrictSSL,
				apiSecret: broadcasterConfig.secrets.api
			},
			{
				uid: this.users[1].user.id,
				authKey: this.users[1].broadcasterToken
			}
		);
		return new SocketClusterClient(config);
	}

	createPubnubClient () {
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		const clientConfig = Object.assign({}, this.apiConfig.broadcastEngine.pubnub);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.users[1].user._pubnubUuid || this.users[1].user.id;
		clientConfig.authKey = this.users[1].broadcasterToken;
		if (this.mockMode) {
			clientConfig.ipc = this.ipc;
			clientConfig.serverId = this.apiConfig.apiServer.ipc.serverId;
		}
		let client = this.mockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}

	// try to subscribe to the team channel
	trySubscribeToTeam (callback) {
		(async () => {
			try {
				await this.broadcasterClient.subscribe(
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
		})();
	}
}

module.exports = TeamSubscriptionRevokedTest;
