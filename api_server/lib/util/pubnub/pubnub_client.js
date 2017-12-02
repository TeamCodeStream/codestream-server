'use strict';

class PubNubClient {

	constructor (options) {
		Object.assign(this, options);
		this.channelListeners = {};
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
		if (!this.channelListeners[channel]) {
			this.channelListeners[channel] = {
				message: (message) => {
					listener(null, message);
				},
				status: (status) => {
					this.handleSubscribeStatus(channel, status, callback);
				}
			};
			this.pubnub.addListener(this.channelListeners[channel]);
		}

		this.pubnub.subscribe({
			channels: [channel]
		});
	}

	handleSubscribeStatus (channel, status, callback) {
		if (
			status.error &&
			(
				status.operation === 'PNSubscribeOperation' ||
				status.operation === 'PNHeartbeatOperation'
			) &&
			status.category === 'PNAccessDeniedCategory'
		) {
			this.removeListener(channel);
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
		this.removeListener(channel);
	}

	removeListener (channel) {
		this.pubnub.removeListener(this.channelListeners[channel]);
		delete this.channelListeners[channel];
	}

	history (channel, callback) {
		this.pubnub.history(
			{ channel: channel },
			(status, response) => {
				if (status.error) {
					return callback(status.errorData);
				}
				else if (!response || !(response.messages instanceof Array)) {
					return callback('no messages array');
				}
				callback(null, response.messages.map(message => message.entry));
			}
		);
	}

	grant (userIds, channel, callback, options = {}) {
		if (!(userIds instanceof Array)) {
			userIds = [userIds];
		}
		this.pubnub.grant(
			{
				channels: [channel],
				authKeys: userIds,
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

	revoke (userIds, channel, callback) {
		if (!(userIds instanceof Array)) {
			userIds = [userIds];
		}
		this.pubnub.grant(
			{
				channels: [channel],
				authKeys: userIds,
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

module.exports = PubNubClient;
