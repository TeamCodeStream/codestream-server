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
			if (this.api.config.api.mockMode) {
				this.api.log('Note - Pubnub service was started in mock mode');
				this.pubnub = new MockPubnub(Object.assign({}, config, { isServer: true }));
				this.pubnub.init();
			}
			else {
				this.pubnub = new PubNub(config);
			}
			this.pubnubClient = new PubNubClient({
				pubnub: this.pubnub
			});
			return { messager: this.pubnubClient };
		};
	}
}

module.exports = Messager;
