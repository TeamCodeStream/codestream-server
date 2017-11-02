'use strict';

var API_Server_Module = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
var PubNub = require('pubnub');
var PubNub_Client = require(process.env.CS_API_TOP + '/lib/util/pubnub/pubnub_client');

class Messager extends API_Server_Module {

	services () {
		return (callback) => {
			if (!this.api.config.pubnub) {
				this.api.warn('Will not connect to PubNub, no PubNub configuration supplied');
				return process.nextTick(callback);
			}

			this.api.log('Connecting to PubNub...');
			this.pubnub = new PubNub(this.api.config.pubnub);
			this.pubnub_client = new PubNub_Client({
				pubnub: this.pubnub
			});
			return callback(null, [{ messager: this.pubnub_client }]);
		};
	}
}

module.exports = Messager;
