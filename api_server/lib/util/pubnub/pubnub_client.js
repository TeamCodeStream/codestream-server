'use strict';

class PubNub_Client {

	constructor (options) {
		Object.assign(this, options);
		this.channel_listeners = {};
	}

	publish (message, channel, callback) {
		this.pubnub.publish(
			{
				message: message,
				channel: channel
			},
			(result) => {
				if (result.error) {
					return callback(result.errorData);
				}
				else {
					return callback();
				}
			}
		);
	}

	subscribe (channel, listener, callback) {
		if (!this.channel_listeners[channel]) {
			this.channel_listeners[channel] = {
				message: (message) => {
					listener(null, message);
				},
				status: (status) => {
					this.handle_status(channel, status, callback);
				}
			};
			this.pubnub.addListener(this.channel_listeners[channel]);
		}
		this.pubnub.subscribe({
			channels: [channel]
		});
	}

	handle_status (channel, status, callback) {
		if (
			status.error &&
			status.operation === 'PNSubscribeOperation'
		) {
			this.remove_listener(channel);
			callback(status);
		}
		else if (
			status.category === 'PNConnectedCategory' &&
			status.operation === 'PNSubscribeOperation' &&
			status.affectedChannels instanceof Array &&
			status.affectedChannels.indexOf(channel) !== -1
		) {
			callback();
		}
	}

	unsubscribe (channel) {
		this.pubnub.unsubscribe({
			channels: [channel]
		});
		this.remove_listener(channel);
	}

	remove_listener (channel) {
		this.pubnub.removeListener(this.channel_listeners[channel]);
		delete this.channel_listeners[channel];
	}

	grant (user_id, channels, callback, options = {}) {
		this.pubnub.grant(
			{
				channels: channels,
				authKeys: [user_id],
				read: options.read === false ? false: true,
				write: options.write === true ? true : false,
				ttl: options.ttl || 0
			},
			(result) => {
				if (result.error) {
					return callback(result.errorData);
				}
				else {
					return callback();
				}
			}
		);
	}

	revoke (user_id, channels, callback) {
		this.pubnub.grant(
			{
				channels: channels,
				authKeys: [user_id],
				read: false,
				write: false,
				manage: false
			},
			(result) => {
				if (result.error) {
					return callback(result.errorData);
				}
				else {
					return callback();
				}
			}
		);
	}
}

module.exports = PubNub_Client;
