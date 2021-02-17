// provides a pub-sub broadcaster service to the API server, this allows messages to be sent
// from server to client (and possibly received from client to server) through pubnub
'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
const PubNub = require('pubnub');
const PubNubClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/pubnub_client_async');
const MockPubnub = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/mock_pubnub');
const SocketClusterClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/socketcluster/socketcluster_client');
const OS = require('os');
const TryIndefinitely = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/try_indefinitely');

class Broadcaster extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the pubnub client as
		// the broadcaster service
		return async () => {
			if (this.api.config.broadcastEngine.selected === 'codestreamBroadcaster') {
				return await this.connectToSocketCluster();
			}
			else if (this.api.config.broadcastEngine.selected === 'pubnub') {
				return await this.connectToPubNub();
			}
			else {
				return this.api.warn('No broadcaster configuration supplied, messaging will not be available');
			}
		};
	}

	async connectToSocketCluster () {
		const broadcasterConfig = this.api.config.broadcastEngine.codestreamBroadcaster;
		const host = broadcasterConfig.host;
		const port = broadcasterConfig.port;
		this.api.log(`Connecting to SocketCluster at ${host}:${port}...`);
		const config = Object.assign({},
			{
				// formerly the socketCluster object
				host,
				port,
				authKey: broadcasterConfig.secrets.api,
				ignoreHttps: broadcasterConfig.ignoreHttps,
				strictSSL: broadcasterConfig.sslCert.requireStrictSSL,
				apiSecret: broadcasterConfig.secrets.api
			},
			{
				logger: this.api,
				uid: 'API'
			});
		this.socketClusterClient = new SocketClusterClient(config);
		await TryIndefinitely(async () => {
			try {
				await this.socketClusterClient.init();
				if (!this.api.config.apiServer.mockMode) {
					await this.socketClusterClient.publish('test', 'test');
				}
			}
			catch (error) {
				const msg = error instanceof Error ? error.message : JSON.stringify(error);
				this.api.warn(`Could not connect to SocketCluster: ${msg}`);
				throw error;
			}
		}, 5000, this.api, 'Unable to connect to SocketCluster, retrying...');
		return { broadcaster: this.socketClusterClient };
	}

	async connectToPubNub () {
		this.api.log('Connecting to PubNub...');
		let config = Object.assign({}, this.api.config.broadcastEngine.pubnub);
		config.uuid = 'API-' + OS.hostname();
		this.pubnub = this.api.config.apiServer.mockMode ? new MockPubnub(config) : new PubNub(config);
		this.pubnubClient = new PubNubClient({
			pubnub: this.pubnub
		});
		if (!this.api.config.apiServer.mockMode) {
			await this.pubnubClient.init();
			await TryIndefinitely(async () => {
				await this.pubnubClient.publish('test', 'test');
			}, 5000, this.api, 'Unable to connect to PubNub, retrying...');
		}
		return { broadcaster: this.pubnubClient };
	}

	async initialize () {
		if (this.api.config.apiServer.mockMode && this.api.config.broadcastEngine.selected === 'pubnub') {
			await this.connectToMockPubnub();
		}
	}

	async connectToMockPubnub () {
		if (!this.api.services.ipc) {
			this.api.warn('No IPC service is available in mock mode');
			return;
		}
		if (!this.pubnub) {
			this.api.warn('Mock Pubnub not available, tests cannot be run against this instance');
			return;
		}
		this.api.log('Note - Pubnub service was started in mock mode');
		this.pubnub.init({
			isServer: true, 
			ipc: this.api.services.ipc,
			serverId: this.api.config.apiServer.ipc.serverId
		});
		await this.pubnubClient.init();
	}
}

module.exports = Broadcaster;
