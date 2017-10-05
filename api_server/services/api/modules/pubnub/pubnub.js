'use strict';

var API_Server_Module = require(process.env.CI_API_TOP + '/lib/api_server/api_server_module');
var PubNub_Client = require('pubnub');
var PubNub_Broadcaster = require(process.env.CI_API_TOP + '/lib/util/pubnub_broadcaster');

class PubNub extends API_Server_Module {

	services () {
		return (callback) => {
			if (!this.api.config.pubnub) {
				this.api.warn('Will not connect to PubNub, no PubNub configuration supplied');
				return process.nextTick(callback);
			}

			this.api.log('Connecting to PubNub...');
			this.pubnub = new PubNub_Client(this.api.config.pubnub);
			this.broadcaster = new PubNub_Broadcaster({
				pubnub: this.pubnub
			});
			return callback(null, [{ broadcaster: this.broadcaster }]);
		};
	}
}

module.exports = PubNub;
