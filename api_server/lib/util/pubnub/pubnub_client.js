// provides a pubnub wrapper client, sparing the caller some of the implementation details

'use strict';

class PubNubClient {

	constructor (options) {
		Object.assign(this, options);
		this.channelListeners = {};
	}

	// publish a message to the specified channel
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

	// subscribe to the specified channel, providing a listener callback for the
	// actual message ... the callback is just whether the subscribe succeeded
	subscribe (channel, listener, callback) {
		// we'll spare the caller from handling status messages, and really
		// just pass back the message they are interested in
		if (!this.channelListeners[channel]) {
			this.channelListeners[channel] = {
				message: (message) => {
					// got a message, call the listener
					listener(null, message);
				},
				status: (status) => {
					// a status message, let's see what's in it
					this.handleSubscribeStatus(channel, status, callback);
				}
			};
			this.pubnub.addListener(this.channelListeners[channel]);
		}

		// subscribe to the channel, but success or failure comes back in a
		// status message
		this.pubnub.subscribe({
			channels: [channel]
		});
	}

	// handle a status message from a subscribed channel
	handleSubscribeStatus (channel, status, callback) {
		if (
			status.error &&
			(
				status.operation === 'PNSubscribeOperation' ||
				status.operation === 'PNHeartbeatOperation'
			) &&
			status.category === 'PNAccessDeniedCategory'
		) {
			// looks like a failure of some kind, we're not really subscribed
			this.removeListener(channel);
			callback(status);
		}
		else if (
			status.category === 'PNConnectedCategory' &&
			status.operation === 'PNSubscribeOperation' &&
			status.affectedChannels instanceof Array &&
			status.affectedChannels.indexOf(channel) !== -1
		) {
			// we're officially subscribed
			callback();
		}
	}

	// unsubscribe from the specified channel
	unsubscribe (channel) {
		this.pubnub.unsubscribe({
			channels: [channel]
		});
		this.removeListener(channel);
	}

	// remove a listener for messages from a particular channel
	removeListener (channel) {
		this.pubnub.removeListener(this.channelListeners[channel]);
		delete this.channelListeners[channel];
	}

	// fetch the history for a particular channel
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

	// grant read and/or write permission to the specified channel for the specified
	// set of tokens (keys)
	grant (tokens, channel, callback, options = {}) {
		if (!(tokens instanceof Array)) {
			tokens = [tokens];
		}
		this.pubnub.grant(
			{
				channels: [channel],
				authKeys: tokens,
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

	// revoke read and/or write permission for the specified channel for the specified
	// set of tokens (keys)
	revoke (tokens, channel, callback) {
		if (!(tokens instanceof Array)) {
			tokens = [tokens];
		}
		this.pubnub.grant(
			{
				channels: [channel],
				authKeys: tokens,
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
