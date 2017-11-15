'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
var PubNub = require('pubnub');
var PubNubClient = require(process.env.CS_API_TOP + '/lib/util/pubnub/pubnub_client');

class Messager extends APIServerModule {

	services () {
		return (callback) => {
			if (!this.api.config.pubnub) {
				this.api.warn('Will not connect to PubNub, no PubNub configuration supplied');
				return process.nextTick(callback);
			}

			this.api.log('Connecting to PubNub...');
			this.pubnub = new PubNub(this.api.config.pubnub);
			this.pubnubClient = new PubNubClient({
				pubnub: this.pubnub
			});
			return callback(null, [{ messager: this.pubnubClient }]);
		};
	}
}

module.exports = Messager;
