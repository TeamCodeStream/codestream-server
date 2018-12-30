// provides a messager service to the API server, this allows messages to be sent
// from server to client (and possibly received from client to server) through pubnub
'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
const PubNub = require('pubnub');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client_async');
const MockPubnub = require(process.env.CS_API_TOP + '/server_utils/pubnub/mock_pubnub');
const OS = require('os');

class Messager extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the pubnub client as
		// the messager service
		return async () => {
			if (!this.api.config.pubnub) {
				return this.api.warn('Will not connect to PubNub, no PubNub configuration supplied');
			}

			this.api.log('Connecting to PubNub...');
			let config = Object.assign({}, this.api.config.pubnub);
			config.uuid = 'API-' + OS.hostname();
			this.pubnub = this.api.config.api.mockMode ? new MockPubnub(config) : new PubNub(config);
			this.pubnubClient = new PubNubClient({
				pubnub: this.pubnub
			});
			if (!this.api.config.api.mockMode) {
				this.pubnubClient.init();
			}
			return { messager: this.pubnubClient };
		};
	}

	async initialize () {
		if (this.api.config.api.mockMode) {
			this.connectToMockPubnub();
		}
	}

	connectToMockPubnub () {
		if (!this.api.services.ipc) {
			this.api.warn('No IPC service is available in mock mode');
			return;
		}
		this.api.log('Note - Pubnub service was started in mock mode');
		this.pubnub.init({
			isServer: true, 
			ipc: this.api.services.ipc,
			serverId: this.api.config.ipc.serverId
		});
		this.pubnubClient.init();
	}
}

module.exports = Messager;
